## 说明
**必须要指定Columns的宽度，还需要注意若在使用中props中含有引用类型数据，应当使用useCallback将其包起来，防止每次引用变化让组件重复刷新**<br />
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
