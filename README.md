## 说明
**必须要指定Columns的宽度**<br />
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
