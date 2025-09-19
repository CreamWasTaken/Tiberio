Set WshShell = CreateObject("WScript.Shell")
WshShell.Environment("PROCESS")("HIDDEN_WINDOW") = "1"
' change the path to the location of the start-app.bat file
WshShell.Run """C:\Users\Jamin\Desktop\Tiberio\start-app.bat""", 0, False
Set WshShell = Nothing

