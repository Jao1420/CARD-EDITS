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
        if (model.image) {
            // desenha imagem aplicando rotação
            this.ctx.save();
            const cx = model.imageX + model.imageWidth / 2;
            const cy = model.imageY + model.imageHeight / 2;
            this.ctx.translate(cx, cy);
            this.ctx.rotate((model.imageRotation || 0) * Math.PI / 180);
            this.ctx.drawImage(model.image, -model.imageWidth / 2, -model.imageHeight / 2, model.imageWidth, model.imageHeight);
            this.ctx.restore();

            // Desenha handle de redimensionamento no canto inferior direito (transform handle position considering rotation: draw at bbox corner)
            // For simplicity, show handle at unrotated bbox corner
            this.imageResizeHandle.x = model.imageX + model.imageWidth;
            this.imageResizeHandle.y = model.imageY + model.imageHeight;
            this.ctx.fillStyle = '#667eea';
            this.ctx.fillRect(
                model.imageX + model.imageWidth - this.imageResizeHandle.size,
                model.imageY + model.imageHeight - this.imageResizeHandle.size,
                this.imageResizeHandle.size,
                this.imageResizeHandle.size
            );
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                model.imageX + model.imageWidth - this.imageResizeHandle.size,
                model.imageY + model.imageHeight - this.imageResizeHandle.size,
                this.imageResizeHandle.size,
                this.imageResizeHandle.size
            );
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

    isMouseOnImageResizeHandle(x, y, model) {
        if (!model.image) return false;
        const handle = this.imageResizeHandle;
        return (
            x > model.imageX + model.imageWidth - handle.size &&
            x < model.imageX + model.imageWidth &&
            y > model.imageY + model.imageHeight - handle.size &&
            y < model.imageY + model.imageHeight
        );
    }

    isMouseOnImage(x, y, model) {
        if (!model.image) return false;
        return (
            x > model.imageX &&
            x < model.imageX + model.imageWidth &&
            y > model.imageY &&
            y < model.imageY + model.imageHeight
        );
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
        } else {
            // Só limpa se não há seleção e o campo não está em foco
            if (document.activeElement !== this.textInput) {
                this.textInput.value = '';
            }
        }
    }
}
