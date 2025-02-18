// file = QrScannerPlugin.jsx
import {MutableRefObject, useEffect, useRef, useState, useCallback} from 'react';
import {ArrowUpTrayIcon} from '@heroicons/react/24/solid';
import {Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats} from 'html5-qrcode';
import {useLogError} from '../../hooks/useError';
import {checkCameraPermissions} from '../../utils/media';
import {TorchButton} from './TorchButton';
import classes from './QrScanner.module.css';

// Id of the HTML element used by the Html5QrcodeScanner.
const qrcodeRegionId = 'html5qr-code-full-region';
const qrcodeFileRegionId = 'html5qr-code-file-region';

/**
 * @returns the aspect ratio of the video feed based on the window size
 */
export const calcAspectRatio = () => {
  // TODO: This is not the ideal way to define the aspect ratio. Could find a way to detect the camera orientation
  if (window.innerWidth < window.innerHeight) {
    return 1.333334;
  }
  return 1.777778;
};

export async function scanFile(file: File): Promise<string> {
  const scanner = new Html5Qrcode(qrcodeFileRegionId, {
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    verbose: import.meta.env.DEV,
  });

  const result = await scanner.scanFileV2(file, false);
  return result.decodedText;
}

interface QrProps {
  fps?: number; // Expected frame rate of qr code scanning. example { fps: 2 } means the scanning would be done every 500 ms.
  disableFlip?: boolean;
  formatsToSupport?: Html5QrcodeSupportedFormats[];
  qrCodeSuccessCallback: (decodedText: string, decodedResult: unknown) => void;
  qrCodeErrorCallback?: (errorMessage: string, error: unknown) => void;
  onPermRefused: () => void;
}

function calculateQrBoxSize() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const minDimension = Math.min(screenWidth, screenHeight);

  // On mobile, use 70% of the smaller screen dimension
  // On desktop (>768px), cap at 400px
  const size = Math.min(minDimension * 0.7, 400);

  // Ensure the size is an even number (required by the library)
  return Math.floor(size - (size % 2));
}

export default function QrScannerPlugin({
  fps = 10,
  disableFlip = false,
  formatsToSupport = [Html5QrcodeSupportedFormats.QR_CODE],
  qrCodeSuccessCallback,
  qrCodeErrorCallback,
  onPermRefused,
}: QrProps) {
  const aspectRatio = calcAspectRatio();
  const html5CustomScanner = useRef<Html5Qrcode | null>(null);
  const [canUseCamera, setCanUseCamera] = useState(true);
  const logError = useLogError();
  const qrRegionRef = useRef<HTMLDivElement>(null);
  const [qrboxSize, setQrboxSize] = useState(calculateQrBoxSize());

  useEffect(() => {
    const handleResize = () => {
      setQrboxSize(calculateQrBoxSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Turn off the torch (if it is on) when navigating away from the scan page
  const switchOffTorch = useCallback(
    async function switchOffTorch(html5CustomScanner: MutableRefObject<Html5Qrcode | null>) {
      try {
        const track = html5CustomScanner?.current?.getRunningTrackCameraCapabilities();
        if (track && track.torchFeature().value()) {
          await track.torchFeature().apply(false);
        }
      } catch (e) {
        // This raises an error about invalid tracks - we have to catch it! (blame the library)
        console.warn('Failed to disable torch:', e);
        logError(`Failed to disable torch: ${e}`);
      }
    },
    [logError]
  );

  useEffect(() => {
    const showQRCode = async () => {
      // Add a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!qrRegionRef.current) {
        return;
      }

      const hasCamPerm: boolean = await checkCameraPermissions();
      if (!hasCamPerm) {
        onPermRefused();
        setCanUseCamera(false);
        return;
      }

      try {
        const cameraState = html5CustomScanner.current?.getState() || 0;

        if (cameraState <= Html5QrcodeScannerState.UNKNOWN) {
          html5CustomScanner.current = new Html5Qrcode(qrcodeRegionId);

          await html5CustomScanner.current.start(
            {facingMode: 'environment'},
            {fps, qrbox: qrboxSize, aspectRatio, disableFlip},
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          );
        }
      } catch (err) {
        console.error('QR Scanner initialization error:', err);
        logError(`QR Scanner initialization error: ${err}`);
      }
    };

    showQRCode().catch(err => {
      console.error('QR Scanner setup error:', err);
      logError(`QR Scanner setup error: ${err}`);
    });

    return () => {
      const stopQrScanner = async () => {
        try {
          await switchOffTorch(html5CustomScanner);
          if (html5CustomScanner.current?.isScanning) {
            await html5CustomScanner.current.stop();
          }
          html5CustomScanner.current?.clear();
          html5CustomScanner.current = null;
        } catch (err) {
          console.error('Error stopping QR scanner:', err);
          logError(`Error stopping QR scanner: ${err}`);
        }
      };

      stopQrScanner();
    };
  }, [
    fps,
    qrboxSize,
    aspectRatio,
    disableFlip,
    formatsToSupport,
    qrCodeSuccessCallback,
    qrCodeErrorCallback,
    onPermRefused,
    switchOffTorch,
    logError,
  ]);

  return (
    <>
      <div className={classes.container}>
        <div className={classes.wrapper}>
          <ShadedRegion size={qrboxSize}></ShadedRegion>
          <div ref={qrRegionRef} id={qrcodeRegionId} />
        </div>
        <TorchButton html5CustomScanner={html5CustomScanner} canUseCamera={canUseCamera} />
      </div>
    </>
  );
}

function ShadedRegion({size}: {size: number}) {
  return <div className={classes['shaded-region']} style={{width: size, height: size}}></div>;
}

export function FileUploadScanner({
  onFileUpload,
}: {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex justify-center">
      <input id="qr-file" type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
      <label
        htmlFor="qr-file"
        className="fit-content flex h-fit cursor-pointer gap-2 gap-2 justify-self-center rounded-lg
                   bg-primary px-4 py-3 text-sm font-medium text-white focus:outline-none
                   active:bg-blue-800 dark:bg-blue-600 dark:active:bg-blue-700"
      >
        <ArrowUpTrayIcon className="h-6 w-6" />
        <span>Upload QR code image</span>
      </label>
      <div id={qrcodeFileRegionId}></div>
    </div>
  );
}
