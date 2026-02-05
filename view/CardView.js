/* View: Responsável por atualizar a interface e o canvas */
export class CardView {
    constructor(canvas, textInput, fontSizeInput, colorInput, savedCardsList) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.textInput = textInput;
        this.fontSizeInput = fontSizeInput;
        this.colorInput = colorInput;
        this.savedCardsList = savedCardsList;
        this.imageResizeHandle = { x: 0, y: 0, size: 12 };
    }

    renderCard(model) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // desenha elementos primeiro (imagens / shapes)
        if (model.elements && model.elements.length) {
            model.elements.forEach((el, eidx) => {
                this.ctx.save();
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                this.ctx.translate(cx, cy);
                this.ctx.rotate((el.rotation || 0) * Math.PI / 180);
                if (el.type === 'image' && el.image && (el.image instanceof HTMLImageElement)) {
                    this.ctx.drawImage(el.image, -el.width / 2, -el.height / 2, el.width, el.height);
                } else if (el.type === 'shape') {
                    this.ctx.fillStyle = el.color || '#000';
                    this.ctx.strokeStyle = el.color || '#000';
                    this.ctx.lineWidth = 2;
                    const w = el.width;
                    const h = el.height;
                    if (el.shape === 'rect' || el.shape === 'bar') {
                        if (el.fill) this.ctx.fillRect(-w/2, -h/2, w, h);
                        else this.ctx.strokeRect(-w/2, -h/2, w, h);
                    } else if (el.shape === 'arrow') {
                        // simple arrow: a line with triangle head
                        this.ctx.beginPath();
                        this.ctx.moveTo(-w/2, 0);
                        this.ctx.lineTo(w/2 - 10, 0);
                        this.ctx.stroke();
                        this.ctx.beginPath();
                        this.ctx.moveTo(w/2 - 10, -6);
                        this.ctx.lineTo(w/2, 0);
                        this.ctx.lineTo(w/2 - 10, 6);
                        this.ctx.closePath();
                        if (el.fill) this.ctx.fill(); else this.ctx.stroke();
                    }
                }

                // draw resize handle for selected element
                if (model.selectedElementIdx === eidx) {
                    this.ctx.restore(); // restore rotation to draw handle in screen space
                    const hx = el.x + el.width;
                    const hy = el.y + el.height;
                    const size = this.imageResizeHandle.size;
                    this.imageResizeHandle.x = hx;
                    this.imageResizeHandle.y = hy;
                    this.ctx.fillStyle = '#667eea';
                    this.ctx.fillRect(hx - size, hy - size, size, size);
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(hx - size, hy - size, size, size);
                } else {
                    this.ctx.restore();
                }
            });
        }

        model.texts.forEach((t, idx) => {
            this.ctx.save();
            this.ctx.translate(t.x, t.y);
            this.ctx.rotate((t.rotation || 0) * Math.PI / 180);
            this.ctx.font = `${t.fontSize}px Arial`;
            this.ctx.fillStyle = t.color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(t.text, 0, 0);

            if (model.selectedIdx === idx) {
                // desenha retângulo ao redor do texto selecionado (aprox via measureText)
                const width = this.ctx.measureText(t.text).width;
                const height = t.fontSize;
                this.ctx.strokeStyle = 'red';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(-width/2 - 4, -height/2 - 4, width + 8, height + 8);
            }
            this.ctx.restore();
        });
    }

    // retorna o índice do elemento cujo handle de resize contém (x,y), ou null
    getElementResizeHandleAt(x, y, model) {
        if (!model.elements) return null;
        const size = this.imageResizeHandle.size;
        for (let i = 0; i < model.elements.length; i++) {
            const el = model.elements[i];
            const hx = el.x + el.width;
            const hy = el.y + el.height;
            if (x > hx - size && x < hx && y > hy - size && y < hy) return i;
        }
        return null;
    }

    // retorna o índice do elemento sob (x,y) ou null
    getElementAt(x, y, model) {
        if (!model.elements) return null;
        for (let i = model.elements.length - 1; i >= 0; i--) {
            const el = model.elements[i];
            if (x > el.x && x < el.x + el.width && y > el.y && y < el.y + el.height) return i;
        }
        return null;
    }

    renderSavedCards(savedCards, onSelect, onDelete) {
        this.savedCardsList.innerHTML = '';
        savedCards.forEach((c, idx) => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.gap = '8px';
            item.style.alignItems = 'center';

            const btn = document.createElement('button');
            btn.style.flex = '1';
            // Mostra nome e resumo dos textos do cartão
            const title = c.name ? c.name : (c.texts && c.texts.length > 0 ? c.texts.map(t => t.text).join(' | ') : 'Cartão vazio');
            btn.textContent = title;
            btn.onclick = () => onSelect(c, idx);

            const del = document.createElement('button');
            del.textContent = 'Excluir';
            del.style.background = '#ff5959';
            del.style.color = '#fff';
            del.style.border = 'none';
            del.style.padding = '6px 8px';
            del.style.borderRadius = '6px';
            del.onclick = (e) => { e.stopPropagation(); if (onDelete) onDelete(idx); };

            item.appendChild(btn);
            item.appendChild(del);
            this.savedCardsList.appendChild(item);
        });
    }

    updateControls(model) {
        if (model.selectedIdx !== null && model.texts[model.selectedIdx]) {
            const t = model.texts[model.selectedIdx];
            if (document.activeElement !== this.textInput) {
                this.textInput.value = t.text;
            }
            this.fontSizeInput.value = t.fontSize;
            this.colorInput.value = t.color;
        } else if (model.selectedElementIdx !== null && model.elements[model.selectedElementIdx]) {
            const el = model.elements[model.selectedElementIdx];
            // when an element is selected, show its color in the color input
            if (this.colorInput) this.colorInput.value = el.color || '#000';
        } else {
            // Só limpa se não há seleção e o campo não está em foco
            if (document.activeElement !== this.textInput) {
                this.textInput.value = '';
            }
        }
    }
}
