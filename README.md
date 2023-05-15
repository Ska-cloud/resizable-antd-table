## 说明
**必须要指定Columns的宽度**<br />
通过react-resizeable库给antd的table的cell加方法，以达到可以拖拽改变列宽的目的。<br />
antd3官方是给出了基于react-resizeable的方法，但是存在列多时卡顿的问题所以被取消了
## example
```typescript
const columns: ResizeTableColumnsType = [
      {
        width: 50,
        resizable: false,
];
const dataSource: object[] = [
  xxx
] 

return (
<ResizeTable
          size="small"
          columns={columns}
          dataSource={ dataSource }
          pagination={{ pageSize: 100 }}
        />
)
```
