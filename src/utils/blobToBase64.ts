//callback - where we want to get result
// @ts-ignore
const blobToBase64 = (blob :Blob, callback) => {
    const reader = new FileReader();
    reader.onload = function () {
        const base64data = typeof reader.result === 'string' ? reader.result.split(",")[1] : null;
        callback(base64data);
    };
    reader.readAsDataURL(blob);
};

export { blobToBase64 };
