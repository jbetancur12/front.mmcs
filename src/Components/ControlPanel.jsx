import { ArrowBack } from '@mui/icons-material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GetAppIcon from '@mui/icons-material/GetApp';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

import PDFPrinter from './PDFPrinter';

const ControlPanel = (props) => {
  const { file, pageNumber, numPages, setPageNumber, scale, setScale } = props;

  const isFirstPage = pageNumber === 1;
  const isLastPage = pageNumber === numPages;

  const firstPageClass = isFirstPage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const lastPageClass = isLastPage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  const goToFirstPage = () => {
    if (!isFirstPage) setPageNumber(1);
  };
  const goToPreviousPage = () => {
    if (!isFirstPage) setPageNumber(pageNumber - 1);
  };
  const goToNextPage = () => {
    if (!isLastPage) setPageNumber(pageNumber + 1);
  };
  const goToLastPage = () => {
    if (!isLastPage) setPageNumber(numPages);
  };

  const onPageChange = (e) => {
    const { value } = e.target;
    setPageNumber(Number(value));
  };

  const isMinZoom = scale < 0.6;
  const isMaxZoom = scale >= 2.0;

  const zoomOutClass = isMinZoom ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const zoomInClass = isMaxZoom ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  const zoomOut = () => {
    if (!isMinZoom) setScale(scale - 0.1);
  };

  const zoomIn = () => {
    if (!isMaxZoom) setScale(scale + 0.1);
  };

  return (
    <div className="control-panel m-3 p-3 flex items-baseline justify-between">
      <div className="flex justify-between items-baseline">
        <ArrowBack
          className={`mx-3 ${firstPageClass}`}
          onClick={goToFirstPage}
        />
        <ArrowForwardIcon
          className={`mx-3 ${firstPageClass}`}
          onClick={goToPreviousPage}
        />
        <span>
          Page{' '}
          <input
            name="pageNumber"
            type="number"
            min={1}
            max={numPages || 1}
            className="p-0 pl-1 mx-2"
            value={pageNumber}
            onChange={onPageChange}
          />{' '}
          of {numPages}
        </span>
        <ArrowForwardIcon
          className={`mx-3 ${lastPageClass}`}
          onClick={goToNextPage}
        />
        <ArrowForwardIcon
          className={`mx-3 ${lastPageClass}`}
          onClick={goToLastPage}
        />
      </div>
      <div className="flex justify-between items-baseline">
        <ZoomOutIcon
          className={`mx-3 ${zoomOutClass}`}
          onClick={zoomOut}
        />
        <span>{(scale * 100).toFixed()}%</span>
        <ZoomInIcon
          className={`mx-3 ${zoomInClass}`}
          onClick={zoomIn}
        />
      </div>
      <div className="mx-3">
        <a href={file} download={true} title="download">
          <GetAppIcon className="cursor-pointer" />
        </a>
      </div>
      <div className="mx-3">
        <PDFPrinter file={file} />
      </div>
    </div>
  );
};

export default ControlPanel;
