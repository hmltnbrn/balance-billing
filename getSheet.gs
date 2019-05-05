function doGet(request) {
  var output = ContentService.createTextOutput();
  var data = {};
  var id = request.parameters.id;
  var sheet = SpreadsheetApp.openById(id);
  var ss = sheet.getActiveSheet();
  output.setContent(JSON.stringify(readData_(ss)));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function readData_(ss, properties) {
  if (typeof properties == "undefined") {
    properties = getHeaderRow_(ss);
    properties = properties.map(function(p) { return p.replace(/\s+/g, '_'); });
  }
  var rows = getDataRows_(ss);
  var data = [];
  for (var r = 0, l = rows.length; r < l; r++) {
    var row = rows[r];
    var record = {};
    for (var p in properties) {
      record[properties[p]] = row[p];
    }
    data.push(record);
  }
  return data;
}

function getDataRows_(ss) {
  return ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn()).getValues();
}

function getHeaderRow_(ss) {
  return ss.getRange(1, 1, 1, ss.getLastColumn()).getValues()[0];
}
