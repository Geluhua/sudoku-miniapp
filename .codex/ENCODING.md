# 编码规范

## UTF-8 无 BOM
微信小程序编译器要求所有源文件使用 **UTF-8 without BOM** 编码。

- PowerShell 5.1 中 `Set-Content -Encoding UTF8` 会自动添加 BOM，导致编译白屏。
- 正确做法：使用 .NET 写入

```powershell
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
```

- 或者使用 PowerShell 7+ 的 `-Encoding UTF8NoBOM`