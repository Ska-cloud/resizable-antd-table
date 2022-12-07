import { SyntheticEvent, useEffect, useState } from 'react';
import { Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { Resizable } from 'react-resizable';
import './style.css';

/*
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

export interface ResizeTableColumnsType extends Array<any>{
  columns: {
    forbidResizeColumn?: boolean;
    width: number;
    title: string;
    render?: (text: string, record: any, index: number) => any
    dataIndex?: string
  }[]
}

type tableProps = {
  dataSource: object[] | undefined,
  columns: ColumnsType[],
  size?: 'default' | 'middle' | 'small',
  pagination?: object | false
  /** 指定哪几列不能改变列宽*/
  forbidResizeColumn?: boolean
}

type ResizeHandleAxis = 's' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne';

type ResizeCallbackData = {
  node: HTMLElement,
  size: { width: number, height: number },
  handle: ResizeHandleAxis
};

// 调整table表头
const ResizeableTitle = (props:
                           {
                             onResizeStart: Function
                             onResize: Function
                             onResizeStop: Function
                             width: number
                             index: number
                             forbidResizeColumn: boolean
                           }) => {
  const {
    index,
    onResize,
    width,
    onResizeStart,
    onResizeStop,
    forbidResizeColumn,
    ...restProps
  } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  if (!forbidResizeColumn && forbidResizeColumn !== undefined) {
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

  const dataSource = tableProps.dataSource
  let [tempColumns, setTempColumns] = useState<any>(tableProps.columns)  // 暂态的Columns
  const [columns, setColumns] = useState<any>([])

  const components = {
    header: {
      cell: ResizeableTitle,
    },
  }

  // 拖拽开始的回调
  const startHandleResize = (index: number) => (e: SyntheticEvent, data: ResizeCallbackData) => {};
  // 拖拽过程的回调
  const handleResize = (index: number) => (e: SyntheticEvent, data: ResizeCallbackData) => {
    let size = data.size
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

  useEffect(() => {
    // 表格内容为异步请求时初始化表格
    setTempColumns(() => tempColumns = tableProps.columns)
    console.log('columns', tableProps.columns)
  }, [tableProps.columns])

  useEffect(() => {

    // 调整表格列宽度时触发
    setColumns((tempColumns || []).map((col: ColumnsType, index: number) => (
      {
      ...col,
      onHeaderCell: (column: { width: number; forbidResizeColumn: boolean }) => ({
        width: column.width,
        onResizeStart: startHandleResize(index),
        onResize: handleResize(index),
        onResizeStop: endHandleResize(index),
        index: index,
        forbidResizeColumn: column.forbidResizeColumn
      }),
    })))
  }, [tempColumns])

  return (
    <div className="components-table-resizable-column">
      <Table
        columns={columns}
        dataSource={dataSource}
        components={components}
        /* @ts-ignore */
        size={tableProps.size}
        pagination={tableProps.pagination}
      />
    </div>
  )
}

export default ResizeTable;
