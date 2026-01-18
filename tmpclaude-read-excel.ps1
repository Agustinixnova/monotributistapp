$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $workbook = $excel.Workbooks.Open("C:\Users\Agus\Downloads\Mis Comprobantes Recibidos - CUIT 27246193342.xlsx")
    $worksheet = $workbook.Worksheets.Item(1)
    $range = $worksheet.UsedRange

    $rowCount = $range.Rows.Count
    $colCount = $range.Columns.Count

    Write-Output "=== PRIMERAS 15 FILAS ==="
    Write-Output "Total filas: $rowCount, Total columnas: $colCount"
    Write-Output ""

    $maxRows = [Math]::Min(15, $rowCount)

    for ($i = 1; $i -le $maxRows; $i++) {
        $row = @()
        for ($j = 1; $j -le $colCount; $j++) {
            $cell = $worksheet.Cells.Item($i, $j).Text
            $row += $cell
        }
        Write-Output "Fila $i : $($row -join ' | ')"
    }

    $workbook.Close($false)
}
finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
