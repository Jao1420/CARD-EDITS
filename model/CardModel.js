// Model para armazenar o estado do cartão e cartões salvos
export class CardModel {
    constructor() {
        this.texts = [];
        this.selectedIdx = null;
        this.image = null;
        this.imageX = 0;
        this.imageY = 0;
        this.imageWidth = 500;
        this.imageHeight = 300;
        this.imageRotation = 0; // graus
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
    setImage(img) {
        this.image = img;
        this.imageX = 0;
        this.imageY = 0;
    }
    deleteImage() {
        this.image = null;
        this.imageX = 0;
        this.imageY = 0;
        this.imageWidth = 500;
        this.imageHeight = 300;
        this.imageRotation = 0;
    }
    setImagePosition(x, y) {
        this.imageX = x;
        this.imageY = y;
    }
    setImageSize(w, h) {
        this.imageWidth = w;
        this.imageHeight = h;
    }
    setTextRotation(deg) {
        if (this.selectedIdx !== null) this.texts[this.selectedIdx].rotation = deg;
    }
    setImageRotation(deg) {
        this.imageRotation = deg;
    }

    saveCard() {
        this.savedCards.push({
            texts: JSON.parse(JSON.stringify(this.texts)),
            image: this.image ? this.image.src : null,
            imageX: this.imageX,
            imageY: this.imageY,
            imageWidth: this.imageWidth,
            imageHeight: this.imageHeight,
            imageRotation: this.imageRotation,
            name: 'Sem nome'
        });
        localStorage.setItem('savedCards', JSON.stringify(this.savedCards));
    }

    saveCardWithName(name) {
        const card = {
            texts: JSON.parse(JSON.stringify(this.texts)),
            image: this.image ? this.image.src : null,
            imageX: this.imageX,
            imageY: this.imageY,
            imageWidth: this.imageWidth,
            imageHeight: this.imageHeight,
            imageRotation: this.imageRotation,
            name: name || 'Sem nome'
        };
        this.savedCards.push(card);
        localStorage.setItem('savedCards', JSON.stringify(this.savedCards));
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