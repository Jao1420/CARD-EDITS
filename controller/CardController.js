import { CardModel } from '../model/CardModel.js';
import { CardView } from '../view/CardView.js';
import { clientToCanvasCoords, loadImageFromDataURL, clamp, measureText } from './utils.js';

export class CardController {
    constructor(canvas, textInput, fontSizeInput, colorInput, saveCardBtn, savedCardsList, deleteBtn, rotateLeftBtn, rotateRightBtn, rotationInput, cardNameInput, saveChangesBtn, newModelBtn) {
        this.model = new CardModel();
        this.view = new CardView(canvas, textInput, fontSizeInput, colorInput, savedCardsList);
        this.currentSavedIndex = null;
        this.dragging = false;
        this.draggingImage = false;
        this.resizingImage = false;
        this.draggingElementIdx = null;
        this.resizingElementIdx = null;
        this.offset = { x: 0, y: 0 };
        this.rotateLeftBtn = rotateLeftBtn;
        this.rotateRightBtn = rotateRightBtn;
        this.rotationInput = rotationInput;
        this.cardNameInput = cardNameInput;
        this.saveChangesBtn = saveChangesBtn;
        this.newModelBtn = newModelBtn;
        this.toast = null;
        this._bindHandlers();
        this.initEvents(textInput, fontSizeInput, colorInput, saveCardBtn, deleteBtn, canvas);
        this.renderAll();
    }

    newModel() {
        // Reseta o modelo para uma tela em branco, preservando os cartões salvos
        this.model.texts = [];
        this.model.selectedIdx = null;
        this.model.elements = [];
        this.model.selectedElementIdx = null;
        this.currentSavedIndex = null;
        if (this.cardNameInput) this.cardNameInput.value = '';
        // reset controller interaction state
        this.dragging = false;
        this.draggingElementIdx = null;
        this.resizingElementIdx = null;
        this.offset = { x: 0, y: 0 };
        this.renderAll();
    }

    addShape(shapeType, x, y, w = 100, h = 40, options = {}) {
        this.model.addShape(shapeType, x, y, w, h, options);
        this.renderAll();
    }

    renderAll() {
        this._clampAllPositions();
        this.view.renderCard(this.model);
        this.view.renderSavedCards(this.model.savedCards, (c, idx) => {
            // mark current loaded saved index
            this.currentSavedIndex = idx;
            this.model.texts = c.texts || [];
            this.model.selectedIdx = this.model.texts.length > 0 ? 0 : null;
            // restore elements (may contain image srcs)
            this.model.elements = c.elements ? JSON.parse(JSON.stringify(c.elements)) : [];
            // if saved card included the original canvas size, rescale positions to current canvas
            const canvas = this.view.canvas;
            if (c.canvasWidth && c.canvasHeight && (c.canvasWidth !== canvas.width || c.canvasHeight !== canvas.height)) {
                const sx = canvas.width / c.canvasWidth;
                const sy = canvas.height / c.canvasHeight;
                this.model.elements = (this.model.elements || []).map(el => ({
                    ...el,
                    x: (el.x || 0) * sx,
                    y: (el.y || 0) * sy,
                    width: (el.width || 0) * sx,
                    height: (el.height || 0) * sy
                }));
            }
            // for any image element that has image as src string, load the Image object
            (this.model.elements || []).forEach((el, i) => {
                if (el.type === 'image' && typeof el.image === 'string') {
                    const src = el.image;
                    el.image = null;
                    const img = new window.Image();
                    img.onload = () => {
                        el.image = img;
                        this._clampAllPositions();
                        this.renderAll();
                    };
                    img.src = src;
                }
            });
            this.model.selectedElementIdx = null;
            this.view.updateControls(this.model);
            if (this.cardNameInput) this.cardNameInput.value = c.name || '';
        }, (idx) => {
            // Deleta cartão salvo
            this.model.deleteSaved(idx);
            if (this.currentSavedIndex === idx) this.currentSavedIndex = null;
            this.renderAll();
        });
        // Enable/disable "Salvar Alterações" button depending on whether a saved card is loaded
        if (this.saveChangesBtn) {
            this.saveChangesBtn.disabled = this.currentSavedIndex === null;
        }
        this.view.updateControls(this.model);
        // Atualiza input de rotação se existir
        if (this.rotationInput) {
            if (this.model.selectedIdx !== null && this.model.texts[this.model.selectedIdx]) {
                this.rotationInput.value = this.model.texts[this.model.selectedIdx].rotation || 0;
            } else if (this.model.selectedElementIdx !== null && this.model.elements[this.model.selectedElementIdx]) {
                this.rotationInput.value = this.model.elements[this.model.selectedElementIdx].rotation || 0;
            } else {
                this.rotationInput.value = 0;
            }
        }
    }

    _showToast(message = 'Salvo', ms = 1400) {
        if (!this.toast) return;
        this.toast.textContent = message;
        this.toast.style.display = 'block';
        // add CSS class for animation
        this.toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            this.toast.classList.remove('show');
            // hide after transition
            setTimeout(() => { this.toast.style.display = 'none'; }, 200);
        }, ms);
    }

    _clampAllPositions() {
        // Garante que textos e imagem fiquem visíveis dentro do canvas
        const canvas = this.view.canvas;
        const ctx = this.view.ctx;
        // Clamp elements
        (this.model.elements || []).forEach((el) => {
            el.width = Math.min(el.width, canvas.width);
            el.height = Math.min(el.height, canvas.height);
            el.x = Math.max(0, Math.min(canvas.width - el.width, el.x));
            el.y = Math.max(0, Math.min(canvas.height - el.height, el.y));
        });
        // Clamp texts
        this.model.texts.forEach((t) => {
            ctx.font = `${t.fontSize}px Arial`;
            const tw = ctx.measureText(t.text).width;
            const th = t.fontSize;
            const halfW = tw / 2;
            const halfH = th / 2;
            t.x = Math.max(halfW, Math.min(canvas.width - halfW, t.x));
            t.y = Math.max(halfH, Math.min(canvas.height - halfH, t.y));
        });
    }

    initEvents(textInput, fontSizeInput, colorInput, saveCardBtn, deleteBtn, canvas) {
        // text controls
        textInput.addEventListener('keydown', this._onTextKeyDown);
        textInput.addEventListener('input', this._onTextInput);
        fontSizeInput.addEventListener('change', this._onFontSizeChange);
        fontSizeInput.addEventListener('input', this._onFontSizeChange);
        colorInput.addEventListener('input', this._onColorInput);

        // save / delete
        saveCardBtn.addEventListener('click', this._onSaveCardClick);
        if (this.saveChangesBtn) this.saveChangesBtn.addEventListener('click', this._onSaveChangesClick);
        deleteBtn.addEventListener('click', this._onDeleteClick);

        // rotation
        if (this.rotateLeftBtn) this.rotateLeftBtn.addEventListener('click', this._onRotateLeft);
        if (this.rotateRightBtn) this.rotateRightBtn.addEventListener('click', this._onRotateRight);
        if (this.rotationInput) this.rotationInput.addEventListener('change', this._onRotationInputChange);

        // canvas interactions
        canvas.addEventListener('mousedown', this._onCanvasMouseDown);
        canvas.addEventListener('mousemove', this._onCanvasMouseMove);
        canvas.addEventListener('mouseup', this._onCanvasMouseUp);
        canvas.addEventListener('mouseleave', this._onCanvasMouseLeave);
        canvas.addEventListener('dragover', this._onCanvasDragOver);
        canvas.addEventListener('drop', this._onCanvasDrop);

        document.addEventListener('paste', this._onDocumentPaste);

        if (this.newModelBtn) this.newModelBtn.addEventListener('click', this._onNewModelClick);
    }

    _bindHandlers() {
        this._onTextKeyDown = this._onTextKeyDown.bind(this);
        this._onTextInput = this._onTextInput.bind(this);
        this._onFontSizeChange = this._onFontSizeChange.bind(this);
        this._onColorInput = this._onColorInput.bind(this);
        this._onSaveCardClick = this._onSaveCardClick.bind(this);
        this._onSaveChangesClick = this._onSaveChangesClick.bind(this);
        this._onDeleteClick = this._onDeleteClick.bind(this);
        this._onRotateLeft = this._onRotateLeft.bind(this);
        this._onRotateRight = this._onRotateRight.bind(this);
        this._onRotationInputChange = this._onRotationInputChange.bind(this);
        this._onCanvasMouseDown = this._onCanvasMouseDown.bind(this);
        this._onCanvasMouseMove = this._onCanvasMouseMove.bind(this);
        this._onCanvasMouseUp = this._onCanvasMouseUp.bind(this);
        this._onCanvasMouseLeave = this._onCanvasMouseLeave.bind(this);
        this._onCanvasDragOver = this._onCanvasDragOver.bind(this);
        this._onCanvasDrop = this._onCanvasDrop.bind(this);
        this._onDocumentPaste = this._onDocumentPaste.bind(this);
        this._onNewModelClick = this._onNewModelClick.bind(this);
    }

    _onTextKeyDown(e) {
        const textInput = this.view.textInput;
        const fontSizeInput = this.view.fontSizeInput;
        const colorInput = this.view.colorInput;
        const canvas = this.view.canvas;
        if (e.key === 'Enter' && textInput.value.trim() !== '') {
            if (this.model.selectedIdx !== null) {
                this.model.setText(textInput.value);
                this.renderAll();
            } else {
                this.model.addText(
                    textInput.value,
                    parseInt(fontSizeInput.value),
                    colorInput.value,
                    canvas.width / 2,
                    canvas.height / 2
                );
                this.renderAll();
                textInput.value = '';
                textInput.blur();
            }
            e.preventDefault();
        }
    }

    _onTextInput() {
        const textInput = this.view.textInput;
        if (this.model.selectedIdx !== null) {
            this.model.setText(textInput.value);
            this.renderAll();
        }
    }

    _onFontSizeChange() {
        const fontSizeInput = this.view.fontSizeInput;
        this.model.setFontSize(parseInt(fontSizeInput.value));
        this.renderAll();
    }

    _onColorInput() {
        const colorInput = this.view.colorInput;
        // if a text is selected, change its color; otherwise if an element is selected, change its color
        if (this.model.selectedIdx !== null) {
            this.model.setColor(colorInput.value);
        } else if (this.model.selectedElementIdx !== null) {
            this.model.setElementColor(this.model.selectedElementIdx, colorInput.value);
        }
        this.renderAll();
    }

    _onSaveCardClick() {
        const name = (this.cardNameInput && this.cardNameInput.value.trim() !== '') ? this.cardNameInput.value.trim() : 'Sem nome';
        // build card payload with elements image src and canvas size so we can rescale on load
        const canvas = this.view.canvas;
        const elems = (this.model.elements || []).map(el => {
            const copy = Object.assign({}, el);
            if (el.type === 'image' && el.image && el.image.src) copy.image = el.image.src;
            return copy;
        });
        const card = { texts: JSON.parse(JSON.stringify(this.model.texts)), elements: elems, canvasWidth: canvas.width, canvasHeight: canvas.height, name };
        this.model.savedCards.push(card);
        localStorage.setItem('savedCards', JSON.stringify(this.model.savedCards));
        this.currentSavedIndex = this.model.savedCards.length - 1;
        if (this.saveChangesBtn) this.saveChangesBtn.disabled = false;
        this.renderAll();
        if (this.toast) this._showToast('Salvo');
    }

    _onSaveChangesClick() {
        if (this.currentSavedIndex !== null && this.currentSavedIndex >= 0) {
            const name = (this.cardNameInput && this.cardNameInput.value.trim() !== '') ? this.cardNameInput.value.trim() : 'Sem nome';
            const canvas = this.view.canvas;
            const elems = (this.model.elements || []).map(el => {
                const copy = Object.assign({}, el);
                if (el.type === 'image' && el.image && el.image.src) copy.image = el.image.src;
                return copy;
            });
            const card = { texts: JSON.parse(JSON.stringify(this.model.texts)), elements: elems, canvasWidth: canvas.width, canvasHeight: canvas.height, name };
            this.model.updateSaved(this.currentSavedIndex, card);
            this.renderAll();
            if (this.toast) this._showToast('Alterações salvas');
        }
    }

    _onDeleteClick() {
        if (this.model.selectedIdx !== null) {
            this.model.deleteText(this.model.selectedIdx);
            this.model.selectedIdx = null;
            this.view.updateControls(this.model);
            this.renderAll();
        } else if (this.model.selectedElementIdx !== null) {
            this.model.deleteElement(this.model.selectedElementIdx);
            this.model.selectedElementIdx = null;
            this.renderAll();
        }
    }

    _onRotateLeft() {
        if (this.model.selectedIdx !== null) {
            const cur = this.model.texts[this.model.selectedIdx].rotation || 0;
            this.model.setTextRotation(cur - 15);
        } else if (this.model.selectedElementIdx !== null) {
            const cur = this.model.elements[this.model.selectedElementIdx].rotation || 0;
            this.model.setElementRotation(this.model.selectedElementIdx, cur - 15);
        }
        this.renderAll();
    }

    _onRotateRight() {
        if (this.model.selectedIdx !== null) {
            const cur = this.model.texts[this.model.selectedIdx].rotation || 0;
            this.model.setTextRotation(cur + 15);
        } else if (this.model.selectedElementIdx !== null) {
            const cur = this.model.elements[this.model.selectedElementIdx].rotation || 0;
            this.model.setElementRotation(this.model.selectedElementIdx, cur + 15);
        }
        this.renderAll();
    }

    _onRotationInputChange() {
        const v = parseFloat(this.rotationInput.value) || 0;
        if (this.model.selectedIdx !== null) {
            this.model.setTextRotation(v);
        } else if (this.model.selectedElementIdx !== null) {
            this.model.setElementRotation(this.model.selectedElementIdx, v);
        }
        this.renderAll();
    }

    _onCanvasMouseDown(e) {
        const canvas = this.view.canvas;
        const { x, y } = clientToCanvasCoords(canvas, e.clientX, e.clientY);

        // Checa textos (do topo para baixo)
        let found = false;
        for (let i = this.model.texts.length - 1; i >= 0; i--) {
            const t = this.model.texts[i];
            const m = measureText(this.view.ctx, t.text, t.fontSize);
            const textWidth = m.width;
            const textHeight = m.height;
            if (
                x > t.x - textWidth / 2 &&
                x < t.x + textWidth / 2 &&
                y > t.y - textHeight / 2 &&
                y < t.y + textHeight / 2
            ) {
                this.model.selectText(i);
                this.view.updateControls(this.model);
                this.dragging = true;
                this.offset.x = x - t.x;
                this.offset.y = y - t.y;
                found = true;
                break;
            }
        }
        if (found) { this.renderAll(); return; }
        // Checa elementos (imagens / shapes)
        const resizeIdx = this.view.getElementResizeHandleAt(x, y, this.model);
        if (resizeIdx !== null) {
            this.resizingElementIdx = resizeIdx;
            return;
        }
        const elIdx = this.view.getElementAt(x, y, this.model);
        if (elIdx !== null) {
            this.model.selectedElementIdx = elIdx;
            this.view.updateControls(this.model);
            this.draggingElementIdx = elIdx;
            const el = this.model.elements[elIdx];
            this.offset.x = x - el.x;
            this.offset.y = y - el.y;
            return;
        }

        this.model.selectedIdx = null;
        this.view.updateControls(this.model);
        this.renderAll();
    }

    _onCanvasMouseMove(e) {
        const canvas = this.view.canvas;
        const { x, y } = clientToCanvasCoords(canvas, e.clientX, e.clientY);

        if (this.resizingElementIdx !== undefined && this.resizingElementIdx !== null && this.model.elements[this.resizingElementIdx]) {
            const minWidth = 10; const minHeight = 10;
            const el = this.model.elements[this.resizingElementIdx];
            const newWidth = clamp(x - el.x, minWidth, canvas.width - el.x);
            const newHeight = clamp(y - el.y, minHeight, canvas.height - el.y);
            this.model.setElementSize(this.resizingElementIdx, newWidth, newHeight);
            this.renderAll();
            return;
        }

        if (this.draggingElementIdx !== undefined && this.draggingElementIdx !== null && this.model.elements[this.draggingElementIdx]) {
            const el = this.model.elements[this.draggingElementIdx];
            const newX = clamp(x - this.offset.x, 0, canvas.width - el.width);
            const newY = clamp(y - this.offset.y, 0, canvas.height - el.height);
            this.model.setElementPosition(this.draggingElementIdx, newX, newY);
            this.renderAll();
            return;
        }

        if (this.dragging && this.model.selectedIdx !== null) {
            const idx = this.model.selectedIdx;
            const t = this.model.texts[idx];
            if (t) {
                const m = measureText(this.view.ctx, t.text, t.fontSize);
                const halfW = m.width / 2; const halfH = m.height / 2;
                let newX = clamp(x - this.offset.x, halfW, canvas.width - halfW);
                let newY = clamp(y - this.offset.y, halfH, canvas.height - halfH);
                this.model.setPosition(newX, newY);
                this.renderAll();
            }
        }

        // cursor hints for elements
        if (this.view.getElementResizeHandleAt(x, y, this.model) !== null) {
            canvas.style.cursor = 'nwse-resize';
        } else if (this.view.getElementAt(x, y, this.model) !== null) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }

    _onCanvasMouseUp() {
        this.dragging = false;
        this.draggingImage = false;
        this.resizingImage = false;
        this.draggingElementIdx = null;
        this.resizingElementIdx = null;
    }

    _onCanvasMouseLeave() {
        this.dragging = false;
        this.draggingImage = false;
        this.resizingImage = false;
    }

    _onCanvasDragOver(e) {
        e.preventDefault();
    }

    async _onCanvasDrop(e) {
        e.preventDefault();
        const canvas = this.view.canvas;
        const { x: dropX, y: dropY } = clientToCanvasCoords(canvas, e.clientX, e.clientY);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const img = await loadImageFromDataURL(evt.target.result);
                    const maxW = canvas.width * 0.8;
                    const scale = Math.min(1, maxW / img.width);
                    const w = img.width * scale;
                    const h = img.height * scale;
                    const posX = clamp(dropX - w / 2, 0, canvas.width - w);
                    const posY = clamp(dropY - h / 2, 0, canvas.height - h);
                    this.model.addImage(img, posX, posY, w, h);
                    this.renderAll();
                } catch (err) {
                    console.error('Erro ao carregar imagem', err);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    _onDocumentPaste(e) {
        if (e.clipboardData && e.clipboardData.items) {
            for (let i = 0; i < e.clipboardData.items.length; i++) {
                const item = e.clipboardData.items[i];
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        loadImageFromDataURL(evt.target.result).then((img) => {
                            // add pasted image centered
                            const canvas = this.view.canvas;
                            const maxW = canvas.width * 0.8;
                            const scale = Math.min(1, maxW / img.width);
                            const w = img.width * scale;
                            const h = img.height * scale;
                            const posX = clamp((canvas.width - w) / 2, 0, canvas.width - w);
                            const posY = clamp((canvas.height - h) / 2, 0, canvas.height - h);
                            this.model.addImage(img, posX, posY, w, h);
                            this.renderAll();
                        });
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    }

    _onNewModelClick(e) {
        e.preventDefault();
        this.newModel();
    }
}
