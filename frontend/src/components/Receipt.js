// components/Receipt.js
import { useState } from 'react';
import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';

const Receipt = ({ transaction, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!transaction) return null;

  // Normalize the transaction data to ensure consistent structure
  const normalizedTransaction = {
    id: transaction.id,
    created_at: transaction.created_at || transaction.createdAt,
    borrow_date: transaction.borrow_date || transaction.borrowDate,
    due_date: transaction.due_date || transaction.dueDate,
    return_date: transaction.return_date || transaction.returnDate,
    status: transaction.status,
    user_name: transaction.user_name || transaction.user?.name || transaction.userName,
    user_email: transaction.user_email || transaction.user?.email || transaction.userEmail,
    user_class: transaction.user_class || transaction.user?.class || 'N/A',
    user_address: transaction.user_address || transaction.user?.address || 'N/A',
    user_nisn: transaction.user_nisn || transaction.user?.nisn || 'N/A',
    book_title: transaction.book_title || transaction.book?.title || transaction.bookTitle,
    book_author: transaction.book_author || transaction.book?.author || transaction.bookAuthor,
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match the animation duration
  };

  const handlePrint = async () => {
    try {
      // Dynamically import jsPDF and qrcode
      const jsPDF = (await import('jspdf')).default;

      // Generate QR code containing the full receipt text (optimized for QR)
      const receiptText = `PEMINJAMAN BUKU'

ID: #${normalizedTransaction.id ? normalizedTransaction.id.toString().padStart(6, '0') : 'N/A'}
Tgl: ${formatDate(normalizedTransaction.created_at)}

Peminjam: ${normalizedTransaction.user_name || 'N/A'}
Kelas: ${normalizedTransaction.user_class || 'N/A'}
Alamat: ${normalizedTransaction.user_address || 'N/A'}
NISN: ${normalizedTransaction.user_nisn || 'N/A'}
Buku: ${normalizedTransaction.book_title || 'N/A'}
Penulis: ${normalizedTransaction.book_author || 'N/A'}

Pinjam: ${formatDate(normalizedTransaction.borrow_date)}
Jatuh Tempo: ${formatDate(normalizedTransaction.due_date)}

Harap kembalikan buku sesuai tanggal jatuh tempo.`;
      const qrData = receiptText;

      // Use a library to generate QR code as data URL
      const QRCode = await import('qrcode');
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Create a new PDF document (increased width for better text wrapping)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [90, 160] // Increased width from 80mm to 90mm, height from 150mm to 160mm
      });

      // Set font to Courier for receipt-like appearance
      doc.setFont('courier');

      // Starting Y position
      let yPos = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 6; // Reduced margin to maximize content width

      // Title
      doc.setFontSize(12);
      doc.text('PEMINJAMAN BUKU', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;

      // Separator
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;

      // Header
      doc.setFontSize(10);
      doc.text('STRUK PEMINJAMAN BUKU', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;

      // Separator
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;

      // Transaction info
      doc.setFontSize(8); // Reduced font size for better fit
      doc.text(`ID Transaksi: #${normalizedTransaction.id ? normalizedTransaction.id.toString().padStart(6, '0') : 'N/A'}`, margin, yPos, { maxWidth: pageWidth - (margin * 2) });
      yPos += 4;
      doc.text(`Tanggal Pinjam: ${formatDate(normalizedTransaction.created_at)}`, margin, yPos, { maxWidth: pageWidth - (margin * 2) });
      yPos += 5; // Reduced spacing

      // Borrower info
      doc.setFontSize(8); // Reduced font size for better fit
      doc.text('Peminjam:', margin, yPos);
      yPos += 4;
      doc.text(`Nama: ${normalizedTransaction.user_name || 'N/A'}`, margin + 4, yPos);
      yPos += 4;
      doc.text(`Kelas: ${normalizedTransaction.user_class || 'N/A'}`, margin + 4, yPos);
      yPos += 4;
      doc.text(`Alamat: ${normalizedTransaction.user_address || 'N/A'}`, margin + 4, yPos);
      yPos += 4;
      doc.text(`NISN: ${normalizedTransaction.user_nisn || 'N/A'}`, margin + 4, yPos);
      yPos += 5; // Reduced spacing

      // Book info
      doc.setFontSize(8); // Reduced font size for better fit
      doc.text('Buku:', margin, yPos);
      yPos += 4;
      doc.text(`Judul: ${normalizedTransaction.book_title || 'N/A'}`, margin + 4, yPos);
      yPos += 4;
      doc.text(`Penulis: ${normalizedTransaction.book_author || 'N/A'}`, margin + 4, yPos);
      yPos += 5; // Reduced spacing

      // Dates - Using full labels with proper text wrapping
      const dueDateLabel = `Tanggal Jatuh Tempo: ${formatDate(normalizedTransaction.due_date)}`;
      const returnDateLabel = normalizedTransaction.return_date ?
        `Tanggal Kembali: ${formatDate(normalizedTransaction.return_date)}` : null;

      // Split long text if needed to prevent overflow
      const maxLineWidth = pageWidth - (margin * 2); // Available width

      // Add due date with proper wrapping
      doc.text(dueDateLabel, margin, yPos, { maxWidth: maxLineWidth });
      yPos += 5; // Increased spacing for better readability

      // Add return date if available
      if (returnDateLabel) {
        doc.text(returnDateLabel, margin, yPos, { maxWidth: maxLineWidth });
        yPos += 4; // Adequate spacing
      } else {
        yPos += 4; // Adequate spacing
      }

      // Separator
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 4;

      // Footer
      doc.setFontSize(8);
      doc.text('Harap kembalikan buku tepat waktu.', pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;

      // Add QR code
      yPos += 6;
      const qrSize = 25; // Size of QR code in mm
      const qrX = (pageWidth - qrSize) / 2; // Center the QR code

      // Add QR code to PDF
      doc.addImage(dataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
      yPos += qrSize + 8; // Move position below QR code with more spacing

      // Add QR code label
      doc.setFontSize(8);
      doc.text('Scan QR untuk verifikasi', pageWidth / 2, yPos, { align: 'center' });

      // Open the PDF in a new window for printing
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Open in a new window
      const printWindow = window.open(pdfUrl, '_blank');

      // Wait a bit for the PDF to load, then trigger print
      setTimeout(() => {
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }, 500);
    } catch (error) {
      console.error('Error generating receipt PDF:', error);

      // Fallback: create a simple text file if PDF generation fails
      const receiptContent = `
PEMINJAMAN BUKU

========================================
           STRUK PEMINJAMAN BUKU
========================================
ID Transaksi: #${normalizedTransaction.id ? normalizedTransaction.id.toString().padStart(6, '0') : 'N/A'}
Tanggal pinjam: ${formatDate(normalizedTransaction.created_at)}

Informasi Peminjam:
Nama: ${normalizedTransaction.user_name || 'N/A'}
Email: ${normalizedTransaction.user_email || 'N/A'}

Detail Buku:
Judul: ${normalizedTransaction.book_title || 'N/A'}
Penulis: ${normalizedTransaction.book_author || 'N/A'}
========================================
Harap kembalikan buku sesuai tanggal jatuh tempo.
========================================
      `;

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `struk_peminjaman_${normalizedTransaction.id || 'unknown'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent bg-opacity-50tambahka ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
      <div className={`relative w-full max-w-md overflow-hidden bg-white rounded-lg shadow-xl ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Struk Peminjaman Buku
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 border border-gray-300 rounded-lg bg-gray-50">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-bold">PEMINJAMAN BUKU</h2>
            </div>

            <div className="py-3 my-4 border-t border-b border-gray-300">
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="font-medium">ID Transaksi:</p>
                  <p className="text-gray-700">#{normalizedTransaction.id ? normalizedTransaction.id.toString().padStart(6, '0') : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">Tanggal pinjam:</p>
                  <p className="text-gray-700">{formatDate(normalizedTransaction.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 font-medium">Informasi Peminjam:</h3>
              <div className="ml-4 text-sm leading-relaxed">
                <p className="break-words whitespace-normal"><span className="font-medium">Nama:</span> {normalizedTransaction.user_name || 'N/A'}</p>
                <p className="break-words whitespace-normal"><span className="font-medium">Kelas:</span> {normalizedTransaction.user_class || 'N/A'}</p>
                <p className="break-words whitespace-normal"><span className="font-medium">Alamat:</span> {normalizedTransaction.user_address || 'N/A'}</p>
                <p className="break-words whitespace-normal"><span className="font-medium">NISN:</span> {normalizedTransaction.user_nisn || 'N/A'}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 font-medium">Detail Buku:</h3>
              <div className="ml-4 text-sm leading-relaxed">
                <p className="break-words whitespace-normal"><span className="font-medium">Judul:</span> {normalizedTransaction.book_title || 'N/A'}</p>
                <p className="break-words whitespace-normal"><span className="font-medium">Penulis:</span> {normalizedTransaction.book_author || 'N/A'}</p>
              </div>
            </div>
            
            <div className="pt-4 mt-6 border-t border-gray-300">
              <p className="text-xs text-center text-black">
                Harap kembalikan buku sesuai tanggal jatuh tempo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 space-x-3 bg-gray-50">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex justify-center px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PrinterIcon className="w-5 h-5 mr-2" />
            Cetak Struk
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex justify-center px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;