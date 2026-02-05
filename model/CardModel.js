// Model para armazenar o estado do cartão e cartões salvos
export class CardModel {
    constructor() {
        this.texts = [];
        this.selectedIdx = null;
        // elementos: podem ser imagens ou shapes
        // cada elemento: { type: 'image'|'shape', x,y,width,height, rotation, ... }
        this.elements = [];
        this.selectedElementIdx = null;
        this.savedCards = this.loadSavedCards();
    }

    addText(text, fontSize, color, x, y) {
        this.texts.push({
            text,
            fontSize,
            color,
            x,
            y,
            rotation: 0
        });
        this.selectedIdx = this.texts.length - 1;
    }
    selectText(idx) {
        this.selectedIdx = idx;
    }
    setText(text) {
        if (this.selectedIdx !== null) this.texts[this.selectedIdx].text = text;
    }
    setFontSize(size) {
        if (this.selectedIdx !== null) this.texts[this.selectedIdx].fontSize = size;
    }
    setColor(color) {
        if (this.selectedIdx !== null) this.texts[this.selectedIdx].color = color;
    }
    setPosition(x, y) {
        if (this.selectedIdx !== null) {
            this.texts[this.selectedIdx].x = x;
            this.texts[this.selectedIdx].y = y;
        }
    }
    deleteText(idx) {
        this.texts.splice(idx, 1);
    }
    // elementos (imagens / shapes)
    addImage(img, x = 0, y = 0, w = 500, h = 300, rotation = 0) {
        this.elements.push({ type: 'image', image: img, x, y, width: w, height: h, rotation });
        this.selectedElementIdx = this.elements.length - 1;
    }
    addShape(shapeType, x, y, w, h, options = {}) {
        const el = {
            type: 'shape',
            shape: shapeType, // 'rect', 'bar', 'arrow'
            x, y, width: w, height: h,
            rotation: options.rotation || 0,
            fill: !!options.fill,
            color: options.color || '#000'
        };
        this.elements.push(el);
        this.selectedElementIdx = this.elements.length - 1;
    }
    deleteElement(idx) {
        if (idx >= 0 && idx < this.elements.length) {
            this.elements.splice(idx, 1);
            if (this.selectedElementIdx === idx) this.selectedElementIdx = null;
        }
    }
    setElementPosition(idx, x, y) {
        if (idx !== null && idx >= 0 && idx < this.elements.length) {
            this.elements[idx].x = x;
            this.elements[idx].y = y;
        }
    }
    setElementSize(idx, w, h) {
        if (idx !== null && idx >= 0 && idx < this.elements.length) {
            this.elements[idx].width = w;
            this.elements[idx].height = h;
        }
    }
    setElementRotation(idx, deg) {
        if (idx !== null && idx >= 0 && idx < this.elements.length) {
            this.elements[idx].rotation = deg;
        }
    }
    setElementColor(idx, color) {
        if (idx !== null && idx >= 0 && idx < this.elements.length) {
            this.elements[idx].color = color;
        }
    }
    setTextRotation(deg) {
        if (this.selectedIdx !== null) this.texts[this.selectedIdx].rotation = deg;
    }
    setImageRotation(deg) {
        // backwards compat: if single image stored in elements, update selected element
        if (this.selectedElementIdx !== null && this.elements[this.selectedElementIdx] && this.elements[this.selectedElementIdx].type === 'image') {
            this.elements[this.selectedElementIdx].rotation = deg;
        }
    }

    saveCard() {
        this.savedCards.push({
            texts: JSON.parse(JSON.stringify(this.texts)),
            elements: JSON.parse(JSON.stringify(this.elements, (k, v) => {
                // replace image objects with src
                if (k === 'image' && v && v.src) return v.src;
                return v;
            })),
            name: 'Sem nome'
        });
        localStorage.setItem('savedCards', JSON.stringify(this.savedCards));
    }

    saveCardWithName(name) {
        const card = {
            texts: JSON.parse(JSON.stringify(this.texts)),
            elements: JSON.parse(JSON.stringify(this.elements, (k, v) => {
                if (k === 'image' && v && v.src) return v.src;
                return v;
            })),
            name: name || 'Sem nome'
        };
        this.savedCards.push(card);
        localStorage.setItem('savedCards', JSON.stringify(this.savedCards));
    }

    updateSaved(idx, card) {
        if (idx >= 0 && idx < this.savedCards.length) {
            this.savedCards[idx] = card;
            localStorage.setItem('savedCards', JSON.stringify(this.savedCards));
        }
    }

    deleteSaved(idx) {
        if (idx >= 0 && idx < this.savedCards.length) {
            this.savedCards.splice(idx, 1);
            localStorage.setItem('savedCards', JSON.stringify(this.savedCards));
        }
    }

    loadSavedCards() {
        return JSON.parse(localStorage.getItem('savedCards') || '[]');
    }
}