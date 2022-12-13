import { SyntheticEvent, useEffect, useState } from 'react';
import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { Resizable } from 'react-resizable';
import './style.css';
import { ExpandableConfig } from 'antd/es/table/interface';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { cloneDeep } from 'lodash';

/** @description
 使用说明：
        传入的columns必须指定width，类型为number
  */

/** @description
  react-resizable props参数类型

type ResizableProps =
{
  children: React.Element<any>,
  width: number,
  height: number,
  // Either a ReactElement to be used as handle, or a function returning an element that is fed the handle's location as its first argument.
  handle: ReactElement<any> | (resizeHandle: ResizeHandleAxis, ref: ReactRef<HTMLElement>) => ReactElement<any>,
  // If you change this, be sure to update your css
  handleSize: [number, number] = [10, 10],
  lockAspectRatio: boolean = false,
  axis: 'both' | 'x' | 'y' | 'none' = 'both',
  minConstraints: [number, number] = [10, 10],
  maxConstraints: [number, number] = [Infinity, Infinity],
  onResizeStop?: ?(e: SyntheticEvent, data: ResizeCallbackData) => any,
  onResizeStart?: ?(e: SyntheticEvent, data: ResizeCallbackData) => any,
  onResize?: ?(e: SyntheticEvent, data: ResizeCallbackData) => any,
  draggableOpts?: ?Object,
  resizeHandles?: ?Array<ResizeHandleAxis> = ['se']
};
 */

export interface ResizeTableColumnsType<T> extends ColumnsType<any> {
  /* 指定哪一列不能改变列宽*/
  resizable?: boolean;
}

type tableProps = {
  id: string; // 为可调宽度的表格增加ID号，用于保存表格宽度信息。注意，ID号必须全局唯一，否则可能出现布局错乱的问题
  dataSource: object[] | undefined;
  columns: ResizeTableColumnsType<any>;
  size?: SizeType;
  pagination?: object | false;
  expandable?: ExpandableConfig<any>;
  scroll?: object;
  rowClassName?: (record: any, index: any) => string;
};

type ResizeHandleAxis = 's' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne';

type ResizeCallbackData = {
  node: HTMLElement;
  size: { width: number; height: number };
  handle: ResizeHandleAxis;
};

// 调整table表头
const ResizeableTitle = (props: {
  onResizeStart: (e: SyntheticEvent, data: ResizeCallbackData) => any;
  onResize: (e: SyntheticEvent, data: ResizeCallbackData) => any;
  onResizeStop: (e: SyntheticEvent, data: ResizeCallbackData) => any;
  width: number;
  resizable: boolean;
}) => {
  const { onResize, width, onResizeStart, onResizeStop, resizable, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  // 不可改变列宽的返回原列
  if (!resizable && resizable !== undefined) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResizeStart={onResizeStart}
      onResize={onResize}
      onResizeStop={onResizeStop}
    >
      <th {...restProps} />
    </Resizable>
  );
};

// 拖拽调整table
const ResizeTable = (tableProps: tableProps) => {
  const dataSource = tableProps.dataSource;
  let [tempColumns, setTempColumns] = useState<any>(tableProps.columns); // 暂态的Columns
  let [columns, setColumns] = useState<any>([]);

  const components = {
    header: {
      cell: ResizeableTitle,
    },
  };

  // 拖拽开始的回调
  const startHandleResize = (index: number) => (e: SyntheticEvent, data: ResizeCallbackData) => {};
  // 拖拽过程的回调
  const handleResize = (index: number) => (e: SyntheticEvent, data: ResizeCallbackData) => {
    let size = data.size;
    const nextColumns = [...tempColumns];
    // 拖拽是调整宽度
    nextColumns[index] = {
      ...nextColumns[index],
      width: size.width,
    };
    setTempColumns(nextColumns);
  };

  // 拖拽结束的回调
  const endHandleResize = (index: number) => (e: SyntheticEvent, data: ResizeCallbackData) => {};

  const getSavedColumnSize = (id: string) => {
    if (!id) {
      return null;
    }

    const result = localStorage.getItem(`table_size::${id}`);
    return JSON.parse(result as string);
  };

  const saveColumnSize = (id: string, columns: any) => {
    if (!id) {
      return;
    }

    const result = {};
    if (columns) {
      for (const column of columns) {
        if (column.title) {
          result[column.title as string] = column.width;
        }
      }
    }

    if (Object.keys(result).length > 0) {
      localStorage.setItem(`table_size::${id}`, JSON.stringify(result));
    }
  };

  useEffect(() => {
    if (tableProps.columns) {
      let columns = cloneDeep(tableProps.columns);

      // 如果之前有保存过宽度，优先使用保存的宽度
      const saved_column_size = getSavedColumnSize(tableProps.id);
      if (saved_column_size) {
        for (let column of columns) {
          if (column.title && saved_column_size[column.title as string]) {
            column.width = saved_column_size[column.title as string];
          }
        }
      }
      // 表格内容为异步请求时初始化表格
      setTempColumns(() => (tempColumns = columns));
      saveColumnSize(tableProps.id, columns);
    }
  }, [tableProps.columns]);

  useEffect(() => {
    // 调整表格列宽度时触发
    setColumns(
      () =>
        (columns = (tempColumns || []).map((col: ColumnsType, index: number) => ({
          ...col,
          onHeaderCell: (column: { width: number; resizable: false }) => ({
            width: column.width,
            onResizeStart: startHandleResize(index),
            onResize: handleResize(index),
            onResizeStop: endHandleResize(index),
            resizable: column.resizable,
          }),
        }))),
    );

    // 调整时将最终宽度保存下来
    saveColumnSize(tableProps.id, columns);
  }, [tempColumns]);

  return (
    <div className="components-table-resizable-column">
      <Table
        columns={columns}
        dataSource={dataSource}
        components={components}
        size={tableProps.size}
        pagination={tableProps.pagination}
        expandable={tableProps.expandable}
        scroll={tableProps.scroll}
        rowClassName={tableProps.rowClassName}
      />
    </div>
  );
};

export default ResizeTable;
