// src/pdfWorker.js
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';
import worker from 'pdfjs-dist/build/pdf.worker.min?url';

GlobalWorkerOptions.workerSrc = worker;




