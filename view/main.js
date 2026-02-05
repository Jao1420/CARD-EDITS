import { CardController } from '../controller/CardController.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cardCanvas');
    const textInput = document.getElementById('textInput');
    const fontSizeInput = document.getElementById('fontSizeInputNum');
    const colorInput = document.getElementById('colorInput');
    const saveCardBtn = document.getElementById('saveCardBtn');
    const cardNameInput = document.getElementById('cardNameInput');
    const savedCardsList = document.getElementById('savedCardsList');
    const deleteBtn = document.getElementById('deleteBtn');
    const rotateLeftBtn = document.getElementById('rotateLeftBtn');
    const rotateRightBtn = document.getElementById('rotateRightBtn');
    const rotationInput = document.getElementById('rotationInput');
    new CardController(canvas, textInput, fontSizeInput, colorInput, saveCardBtn, savedCardsList, deleteBtn, rotateLeftBtn, rotateRightBtn, rotationInput, cardNameInput);
});
