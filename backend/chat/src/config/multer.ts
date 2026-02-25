import multer from "multer";
const memStorage = multer.memoryStorage();
const upload = multer({storage: memStorage});
export { upload };