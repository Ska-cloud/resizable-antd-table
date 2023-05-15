import {
  SyntheticEvent,
  memo,
  useEffect,
  useRef,
  useState
} from 'react';
import { Table } from 'antd';
import { ColumnsType, ColumnType } from 'antd/lib/table';
import { Resizable } from 'react-resizable';
import { ExpandableConfig } from 'antd/es/table/interface';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { cloneDeep } from 'lodash';
import styled from "styled-components";

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

export interface ResizeColumnType<T> extends ColumnType<any> {
  /* 指定哪一列不能改变列宽*/
  resizable?: boolean;
}

export declare type ResizeTableColumnsType<T> = ResizeColumnType<any>[];

type TableProps = {
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

const Container = styled.div`
  position: relative;
  width: 100%;
`;

type ResizeLineProps = {
  left: number;
  height: number;
};

const ResizeLine = styled.div.attrs((props: any) => ({
  style: {
    left: props.left || 0,
    height: parseInt(props.height) || 0, // 将字符串转换为数字
  },
}))<ResizeLineProps>`
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-left: 2px dashed #d9d9d9;
  z-index: 9999;
`;

type StyleProps = {
  resize?: boolean;
};

const ResizeTableStyle = styled(Resizable)<StyleProps>`
    user-select: none;
    &::before {
        position: absolute;
        top: 50%;
        right: 0;
        width: 1px;
        height: 1.6em;
        background-color: rgba(0,0,0,.06);
        transform: translateY(-50%);
        transition: background-color .3s;
        content: "";
    }

    &:last-child::before {
        display: none;
    }

    .react-resizable {
        position: relative;
        background-clip: padding-box;
    }

    .react-resizable-handle {
        position: absolute;
        width: 10px;
        height: 100%;
        bottom: 0;
        right: -5px;
        cursor: col-resize;
        background-image:none;
        z-index: 1;
    }
`;

// 调整table表头
const ResizeableTitle = (props: {
  onResizeStart: (e: SyntheticEvent, data: ResizeCallbackData) => any;
  onResize: (e: SyntheticEvent, data: ResizeCallbackData) => any;
  width: number;
  resizable: boolean;
  onResizeStop: (e: SyntheticEvent, data: ResizeCallbackData) => any;
}) => {
  const { onResize, width, resizable, onResizeStart, onResizeStop, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  // 不可改变列宽的返回原列
  if (!resizable && resizable !== undefined) {
    return <th {...restProps} />;
  }

  return (
    <ResizeTableStyle
      width={width}
      height={0}
      onResize={onResize}
      onResizeStart={onResizeStart}
      onResizeStop={onResizeStop}>
      <th {...restProps} />
    </ResizeTableStyle>
  );
};

// 拖拽调整table
const ResizeTable = memo((props: TableProps) => {
  const { columns = [], id, scroll, ...rest } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null); // 添加 tableRef
  let [tableColumns, setTableColumns] = useState<any[]>(columns);

  const [dashedLineHeight, setDashedLineHeight] = useState<number>(100)

  const [end, setEnd] = useState(0);
  const [start, setStart] = useState(0);
  const [show, setShow] = useState(false);

  const getSavedColumnSize = (id: string): { [key: string]: number } | null => {
    try {
      const result = localStorage.getItem(`table_size::${id}`);
      if (result) {
        return JSON.parse(result);
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const saveColumnSize = (id: string, columns: any) => {
    if (!id) {
      return;
    }

    const result: { [key: string]: number } = {};
    if (columns) {
      for (const column of columns) {
        if (column.title) {
          result[column.title as string] = column.width;
        }
      }
    }

    if (Object.keys(result).length > 0) {
      localStorage.setItem(`table_size::${id}`, JSON.stringify(result));
    } else {
      localStorage.removeItem(`table_size::${id}`);
    }
  };

  // 拖拽开始的回调
  const startHandleResize = (index: number) => (e: SyntheticEvent, data: ResizeCallbackData) => {
    // @ts-ignore
    const { clientX } = e;
    const dragX =
      clientX - (containerRef.current as any)?.getBoundingClientRect().x;
    setStart(dragX);
    setEnd(dragX);
    setShow(true);
  };

  // 拖拽结束的回调
  const endHandleResize = (index: number) => (e: any, data: ResizeCallbackData) => {
    const { clientX } = e;
    const dragX =
      clientX - (containerRef.current as any)?.getBoundingClientRect().x;

    const nextColumns = [...tableColumns];

    nextColumns[index] = {
      ...nextColumns[index],
      width: (data.size.width += dragX - start),
    };
    setTableColumns(nextColumns);
    saveColumnSize(id, nextColumns)
    setEnd(0);
    setStart(0);
    setShow(false);
  }

  const handleResize = (index: number) => (e: any) => {
    const { clientX } = e;
    const dragX = clientX - (containerRef.current as any)?.getBoundingClientRect().x;

    if (dragX < 0) {
      return
    }

    if (dragX > (containerRef.current as any)?.getBoundingClientRect().width) {
      return;
    }

    setEnd(dragX);
  }

  // 表格数据初始化
  useEffect(() => {
    if (columns) {
      let columnsBackup = cloneDeep(columns);

      // 如果之前有保存过宽度，优先使用保存的宽度
      const saved_column_size = getSavedColumnSize(id);
      if (saved_column_size) {
        for (let column of columnsBackup) {
          if (column.title && saved_column_size[column.title as string]) {
            column.width = saved_column_size[column.title as string];
          }
        }
      }
      // 表格内容为异步请求时初始化表格
      setTableColumns(columnsBackup);
    }
  }, [columns]);

  // 监听表格高度变化
  useEffect(() => {
    const tableHeight: number = (containerRef.current as any)?.querySelector('.ant-table').getBoundingClientRect().height
    setDashedLineHeight(tableHeight);
  }, [tableColumns]);


  return (
    <Container ref={containerRef}>
      <Table
        ref={tableRef}
        columns={(tableColumns.map((col: ColumnsType, index: number) => ({
          ...col,
          onHeaderCell: (column: { width: number; resizable: boolean }) => ({
            width: column.width,
            onResize: handleResize(index),
            resizable: column.resizable,
            onResizeStart: startHandleResize(index),
            onResizeStop: endHandleResize(index),
          }),
        })) as any)}
        components={{
          header: {
            cell: ResizeableTitle,
          },
        }}
        scroll={scroll || { x: 400 }}
        {...rest}
      />
      {show && <ResizeLine left={end || start} height={dashedLineHeight}/>}
    </Container>
  );
});

export default ResizeTable;
