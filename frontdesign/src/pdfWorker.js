// src/pdfWorker.js
import { GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min?url';

GlobalWorkerOptions.workerSrc = workerSrc;
