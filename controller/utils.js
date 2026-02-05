// Pequenas funções utilitárias para o CardController
export function clientToCanvasCoords(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

export function loadImageFromDataURL(dataURL) {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = dataURL;
    });
}

export function measureText(ctx, text, fontSize) {
    ctx.font = `${fontSize}px Arial`;
    return {
        width: ctx.measureText(text).width,
        height: fontSize
    };
}
