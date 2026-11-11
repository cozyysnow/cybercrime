import { NextRequest, NextResponse } from 'next/server';
import { extractOcrWithPaddle } from '@/lib/ocr/paddleOcrService';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      const caseId = (formData.get('caseId') as string) || 'CY2026-MH-44521';

      if (!file || typeof file === 'string') {
        return NextResponse.json(
          { status: 'error', error: 'No file provided in form data' },
          { status: 400 }
        );
      }

      const fileObj = file as File;
      if (fileObj.size === 0) {
        return NextResponse.json(
          { status: 'error', error: 'Empty file payload provided. File size is 0 bytes.' },
          { status: 400 }
        );
      }
      const arrayBuffer = await fileObj.arrayBuffer();
      const result = await extractOcrWithPaddle(arrayBuffer, fileObj.name, caseId);
      return NextResponse.json(result);
    } else {
      // JSON payload
      const body = await req.json();
      const { text, fileBase64, fileName = 'evidence_screenshot.png', caseId = 'CY2026-MH-44521' } = body;

      const hasText = typeof text === 'string' && text.trim().length > 0;
      const hasBase64 = typeof fileBase64 === 'string' && fileBase64.trim().length > 0;

      if (!hasText && !hasBase64) {
        return NextResponse.json(
          { status: 'error', error: 'No valid text or fileBase64 provided in JSON body. Empty payload rejected.' },
          { status: 400 }
        );
      }

      let dataToProcess: any = hasText ? text.trim() : '';
      if (hasBase64) {
        let cleanB64 = fileBase64.trim();
        if (cleanB64.includes('base64,')) {
          cleanB64 = cleanB64.split('base64,')[1];
        }
        cleanB64 = cleanB64.replace(/\s+/g, '');
        if (!cleanB64) {
          return NextResponse.json(
            { status: 'error', error: 'Empty fileBase64 payload provided' },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(cleanB64, 'base64');
        if (buffer.length === 0) {
          return NextResponse.json(
            { status: 'error', error: 'Empty fileBase64 payload provided. Decoded to 0 bytes.' },
            { status: 400 }
          );
        }
        dataToProcess = buffer;
      }

      const result = await extractOcrWithPaddle(dataToProcess, fileName, caseId);
      if (result.status === 'error') {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result);
    }
  } catch (err: any) {
    console.error('PaddleOCR API error:', err);
    return NextResponse.json(
      { status: 'error', error: err.message || 'PaddleOCR processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    engine: 'PaddleOCR v2.8 Multilingual Indic',
    supported_scripts: [
      'Devanagari (Hindi/Marathi)',
      'Bengali',
      'Tamil',
      'Telugu',
      'Gujarati',
      'Kannada',
      'Malayalam',
      'Odia',
      'Gurmukhi (Punjabi)',
      'Urdu',
      'Latin',
    ],
    compliance: 'Section 63 Bharatiya Sakshya Adhiniyam, 2023',
  });
}
