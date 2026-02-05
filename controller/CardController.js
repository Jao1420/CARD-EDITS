import { CardModel } from '../model/CardModel.js';
import { CardView } from '../view/CardView.js';

export class CardController {
    constructor(canvas, textInput, fontSizeInput, colorInput, saveCardBtn, savedCardsList, deleteBtn, rotateLeftBtn, rotateRightBtn, rotationInput, cardNameInput) {
        this.model = new CardModel();
        this.view = new CardView(canvas, textInput, fontSizeInput, colorInput, savedCardsList);
        this.dragging = false;
        this.draggingImage = false;
        this.resizingImage = false;
        this.offset = { x: 0, y: 0 };
        this.rotateLeftBtn = rotateLeftBtn;
        this.rotateRightBtn = rotateRightBtn;
        this.rotationInput = rotationInput;
        this.cardNameInput = cardNameInput;
        this.initEvents(textInput, fontSizeInput, colorInput, saveCardBtn, deleteBtn, canvas);
        this.renderAll();
    }

    renderAll() {
        this.view.renderCard(this.model);
        this.view.renderSavedCards(this.model.savedCards, (c, idx) => {
            this.model.texts = c.texts || [];
            this.model.selectedIdx = this.model.texts.length > 0 ? 0 : null;
            this.model.imageX = c.imageX || 0;
            this.model.imageY = c.imageY || 0;
            this.model.imageWidth = c.imageWidth || 500;
            this.model.imageHeight = c.imageHeight || 300;
            this.model.imageRotation = c.imageRotation || 0;
            // Restaurar imagem se houver
            if (c.image && typeof c.image === 'string') {
                const img = new window.Image();
                img.onload = () => {
                    this.model.image = img;
                    this.renderAll();
                };
                img.src = c.image;
            } else {
                this.model.image = c.image || null;
                this.renderAll();
            }
            this.view.updateControls(this.model);
            if (this.cardNameInput) this.cardNameInput.value = c.name || '';
        }, (idx) => {
            // Deleta cartão salvo
            this.model.deleteSaved(idx);
            this.renderAll();
        });
        this.view.updateControls(this.model);
        // Atualiza input de rotação se existir
        if (this.rotationInput) {
            if (this.model.selectedIdx !== null && this.model.texts[this.model.selectedIdx]) {
                this.rotationInput.value = this.model.texts[this.model.selectedIdx].rotation || 0;
            } else if (this.model.image) {
                this.rotationInput.value = this.model.imageRotation || 0;
            } else {
                this.rotationInput.value = 0;
            }
        }
    }

    initEvents(textInput, fontSizeInput, colorInput, saveCardBtn, deleteBtn, canvas) {
        // Adiciona texto ao pressionar Enter
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && textInput.value.trim() !== '') {
                // Adiciona novo texto centralizado
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
        });
        // Atualiza texto ao editar (somente se há texto selecionado)
        textInput.addEventListener('input', () => {
            if (this.model.selectedIdx !== null) {
                this.model.setText(textInput.value);
                this.renderAll();
            }
        });
        fontSizeInput.addEventListener('change', () => {
            this.model.setFontSize(parseInt(fontSizeInput.value));
            this.renderAll();
        });
        fontSizeInput.addEventListener('input', () => {
            this.model.setFontSize(parseInt(fontSizeInput.value));
            this.renderAll();
        });
        colorInput.addEventListener('input', () => {
            this.model.setColor(colorInput.value);
            this.renderAll();
        });
        saveCardBtn.addEventListener('click', () => {
            if (this.cardNameInput && this.cardNameInput.value.trim() !== '') {
                this.model.saveCardWithName(this.cardNameInput.value.trim());
            } else {
                this.model.saveCardWithName('Sem nome');
            }
            this.renderAll();
        });
        deleteBtn.addEventListener('click', () => {
            if (this.model.selectedIdx !== null) {
                this.model.deleteText(this.model.selectedIdx);
                this.model.selectedIdx = null;
                this.view.updateControls(this.model);
                this.renderAll();
            } else if (this.model.image) {
                this.model.deleteImage();
                this.renderAll();
            }
        });

        // Rotação: botões e input
        if (this.rotateLeftBtn) {
            this.rotateLeftBtn.addEventListener('click', () => {
                if (this.model.selectedIdx !== null) {
                    const cur = this.model.texts[this.model.selectedIdx].rotation || 0;
                    this.model.setTextRotation(cur - 15);
                } else if (this.model.image) {
                    this.model.setImageRotation((this.model.imageRotation || 0) - 15);
                }
                this.renderAll();
            });
        }
        if (this.rotateRightBtn) {
            this.rotateRightBtn.addEventListener('click', () => {
                if (this.model.selectedIdx !== null) {
                    const cur = this.model.texts[this.model.selectedIdx].rotation || 0;
                    this.model.setTextRotation(cur + 15);
                } else if (this.model.image) {
                    this.model.setImageRotation((this.model.imageRotation || 0) + 15);
                }
                this.renderAll();
            });
        }
        if (this.rotationInput) {
            this.rotationInput.addEventListener('change', () => {
                const v = parseFloat(this.rotationInput.value) || 0;
                if (this.model.selectedIdx !== null) {
                    this.model.setTextRotation(v);
                } else if (this.model.image) {
                    this.model.setImageRotation(v);
                }
                this.renderAll();
            });
        }
        // Drag para mover texto / imagem (usa coordenadas convertidas)
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            // Checa se clicou em algum texto primeiro (prioridade)
            let found = false;
            for (let i = this.model.texts.length - 1; i >= 0; i--) {
                const t = this.model.texts[i];
                this.view.ctx.font = `${t.fontSize}px Arial`;
                const textWidth = this.view.ctx.measureText(t.text).width;
                const textHeight = t.fontSize;
                if (
                    x > t.x - textWidth / 2 &&
                    x < t.x + textWidth / 2 &&
                    y > t.y - textHeight / 2 &&
                    y < t.y + textHeight / 2
                ) {
                    this.model.selectText(i);
                    this.view.updateControls(this.model);
                    // Permite arrastar
                    this.dragging = true;
                    this.offset.x = x - t.x;
                    this.offset.y = y - t.y;
                    found = true;
                    break;
                }
            }

            if (found) {
                this.renderAll();
                return;
            }

            // Checa se clicou no handle de redimensionamento da imagem
            if (this.view.isMouseOnImageResizeHandle(x, y, this.model)) {
                this.resizingImage = true;
                return;
            }

            // Checa se clicou na imagem (para mover)
            if (this.view.isMouseOnImage(x, y, this.model)) {
                this.draggingImage = true;
                this.offset.x = x - this.model.imageX;
                this.offset.y = y - this.model.imageY;
                return;
            }

            // Nenhum elemento foi selecionado
            this.model.selectedIdx = null;
            this.view.updateControls(this.model);
            this.renderAll();
        });
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            // Redimensiona imagem
            if (this.resizingImage && this.model.image) {
                const minWidth = 50;
                const minHeight = 50;
                const newWidth = Math.max(minWidth, Math.min(canvas.width - this.model.imageX, x - this.model.imageX));
                const newHeight = Math.max(minHeight, Math.min(canvas.height - this.model.imageY, y - this.model.imageY));
                this.model.setImageSize(newWidth, newHeight);
                this.renderAll();
                return;
            }

            // Move imagem
            if (this.draggingImage && this.model.image) {
                const newX = Math.max(0, Math.min(canvas.width - this.model.imageWidth, x - this.offset.x));
                const newY = Math.max(0, Math.min(canvas.height - this.model.imageHeight, y - this.offset.y));
                this.model.setImagePosition(newX, newY);
                this.renderAll();
                return;
            }

            // Move texto selecionado
            if (this.dragging && this.model.selectedIdx !== null) {
                this.model.setPosition(x - this.offset.x, y - this.offset.y);
                this.renderAll();
            }

            // Muda cursor se estiver sobre o handle da imagem
            if (this.view.isMouseOnImageResizeHandle(x, y, this.model)) {
                canvas.style.cursor = 'nwse-resize';
            } else if (this.view.isMouseOnImage(x, y, this.model)) {
                canvas.style.cursor = 'grab';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        });
        canvas.addEventListener('mouseup', () => {
            this.dragging = false;
            this.draggingImage = false;
            this.resizingImage = false;
        });
        canvas.addEventListener('mouseleave', () => {
            this.dragging = false;
            this.draggingImage = false;
            this.resizingImage = false;
        });
        // Upload de imagem
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const dropX = (e.clientX - rect.left) * scaleX;
            const dropY = (e.clientY - rect.top) * scaleY;

            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const img = new window.Image();
                    img.onload = () => {
                        // Define tamanho padrão baseado na largura do canvas, mantendo proporção simples
                        const maxW = canvas.width * 0.8;
                        const scale = Math.min(1, maxW / img.width);
                        const w = img.width * scale;
                        const h = img.height * scale;
                        this.model.setImage(img);
                        this.model.setImageSize(w, h);
                        // Centraliza a imagem na posição do drop
                        const posX = Math.max(0, Math.min(canvas.width - w, dropX - w / 2));
                        const posY = Math.max(0, Math.min(canvas.height - h, dropY - h / 2));
                        this.model.setImagePosition(posX, posY);
                        this.renderAll();
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
        // Colar imagem
        document.addEventListener('paste', (e) => {
            if (e.clipboardData && e.clipboardData.items) {
                for (let i = 0; i < e.clipboardData.items.length; i++) {
                    const item = e.clipboardData.items[i];
                    if (item.type.indexOf('image') !== -1) {
                        const file = item.getAsFile();
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            const img = new window.Image();
                            img.onload = () => {
                                this.model.setImage(img);
                                this.renderAll();
                            };
                            img.src = evt.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
        });
    }
}
