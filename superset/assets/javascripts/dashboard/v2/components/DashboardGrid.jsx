import React from 'react';
import PropTypes from 'prop-types';
import ParentSize from '@vx/responsive/build/components/ParentSize';

import DashboardComponent from '../containers/DashboardComponent';
import DragDroppable from './dnd/DragDroppable';

import {
  // DASHBOARD_ROOT_ID,
  GRID_GUTTER_SIZE,
  GRID_COLUMN_COUNT,
} from '../util/constants';

const propTypes = {
  dashboard: PropTypes.object.isRequired,
  updateComponents: PropTypes.func.isRequired,
  handleComponentDrop: PropTypes.func.isRequired,
};

const defaultProps = {
};

class DashboardGrid extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isResizing: false,
      rowGuideTop: null,
    };

    this.handleResizeStart = this.handleResizeStart.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleResizeStop = this.handleResizeStop.bind(this);
    this.getRowGuidePosition = this.getRowGuidePosition.bind(this);
  }

  getRowGuidePosition(resizeRef) {
    if (resizeRef && this.grid) {
      return resizeRef.getBoundingClientRect().bottom - this.grid.getBoundingClientRect().top - 1;
    }
    return null;
  }

  handleResizeStart({ ref, direction }) {
    let rowGuideTop = null;
    if (direction === 'bottom' || direction === 'bottomRight') {
      rowGuideTop = this.getRowGuidePosition(ref);
    }

    this.setState(() => ({
      isResizing: true,
      rowGuideTop,
    }));
  }

  handleResize({ ref, direction }) {
    if (direction === 'bottom' || direction === 'bottomRight') {
      this.setState(() => ({ rowGuideTop: this.getRowGuidePosition(ref) }));
    }
  }

  handleResizeStop({ id, widthMultiple, heightMultiple }) {
    const { dashboard: components, updateComponents } = this.props;
    const component = components[id];
    if (
      component &&
      (component.meta.width !== widthMultiple || component.meta.height !== heightMultiple)
    ) {
      updateComponents({
        [id]: {
          ...component,
          meta: {
            ...component.meta,
            width: widthMultiple || component.meta.width,
            height: heightMultiple || component.meta.height,
          },
        },
      });
    }
    this.setState(() => ({
      isResizing: false,
      rowGuideTop: null,
    }));
  }

  render() {
    const { gridComponent, handleComponentDrop } = this.props;
    const { isResizing, rowGuideTop } = this.state;

    return (
      <div className="grid-container" ref={(ref) => { this.grid = ref; }}>
        <ParentSize>
          {({ width }) => {
            // account for (COLUMN_COUNT - 1) gutters
            const columnPlusGutterWidth = (width + GRID_GUTTER_SIZE) / GRID_COLUMN_COUNT;
            const columnWidth = columnPlusGutterWidth - GRID_GUTTER_SIZE;

            return width < 50 ? null : (
              <div className="grid-content">
                {gridComponent.children.map((id, index) => (
                  <DashboardComponent
                    key={id}
                    id={id}
                    parentId={gridComponent.id}
                    depth={0}
                    index={index}
                    availableColumnCount={GRID_COLUMN_COUNT}
                    columnWidth={columnWidth}
                    onResizeStart={this.handleResizeStart}
                    onResize={this.handleResize}
                    onResizeStop={this.handleResizeStop}
                  />
                ))}

                {/* render an empty drop target */}
                {gridComponent.children.length === 0 &&
                  <DragDroppable
                    component={gridComponent}
                    parentComponent={null}
                    index={0}
                    orientation="column"
                    onDrop={handleComponentDrop}
                    className="empty-grid-droptarget"
                  >
                    {({ dropIndicatorProps }) => dropIndicatorProps &&
                      <div {...dropIndicatorProps} />}
                  </DragDroppable>}

                {isResizing && Array(GRID_COLUMN_COUNT).fill(null).map((_, i) => (
                  <div
                    key={`grid-column-${i}`}
                    className="grid-column-guide"
                    style={{
                      left: (i * GRID_GUTTER_SIZE) + (i * columnWidth),
                      width: columnWidth,
                    }}
                  />
                ))}

                {isResizing && rowGuideTop &&
                  <div
                    className="grid-row-guide"
                    style={{
                      top: rowGuideTop,
                      width,
                    }}
                  />}
              </div>
            );
          }}
        </ParentSize>
      </div>
    );
  }
}

DashboardGrid.propTypes = propTypes;
DashboardGrid.defaultProps = defaultProps;

export default DashboardGrid;
