//console.log('hello world')

var container = document.getElementById('editor');
var editor = new Quill(container);

var buffertext_list = [
  'Ⓐ',
  'Ⓑ',
  'Ⓒ',
  'Ⓓ',
];

var color_list = [
  'rgb(0,0,255)',
  'rgb(255,0,0)',
  'rgb(0,255,0)',
]

var dataset = [
  {
    src: '中华人民共和国，建成中国，是一个位于东亚的社会主义国家，成立于1949年10月1日，首都为北京市',
    trg: 'The Peoples Republic of China, abbreviated as China, is a socialist country in East Asia, founded in Oct 1, 1949, its capital is Beijing.',
    edits: [
      [4, 7, "People's"],
      [90, 7, 'established'],
      [112, 5, '. Its'],
    ]
  },
  {
    src: '越南是位于东南亚的中南半岛东端的社会主义国家',
    trg: 'Viet Nam is a socialist country located in south east Asia.',
    edits: [
      [0, 8, "Vietnam"],
      [43, 10, 'Southeast'],
    ]
  },
]

var dataset_idx = 0;


function set_idx(dataset_idx) {
  var info = dataset[dataset_idx];
  var srctext = info.src;
  var text = info.trg;
  var edits = info.edits;
  var edit_states = [0,0,0];
  document.getElementById('srctxt').innerText = srctext;
  updateText(text, edits, edit_states);
}

var srctext = '中华人民共和国，建成中国，是一个位于东亚的社会主义国家，成立于1949年10月1日，首都为北京市';




function updateText(text, edits, edit_states) {

  function suggestionClicked(idx, is_accept) {
    if (is_accept) {
      edit_states[idx] = 2
    } else {
      edit_states[idx] = 1
    }
    updateText(text, edits, edit_states);
  }

  editor.setText('', 'api');
  var newtext = text;
  var offset = 0;
  var formats = [];
  var suggestions = [];
  for (var idx = 0; idx < edits.length; ++idx) {
    var edit = edits[idx];
    var buffertext = buffertext_list[idx];
    var [editidx, replacelen, replacetext] = edit;
    var state = edit_states[idx];
    console.log(state)
    var origtext = newtext.substring(offset + editidx, offset + editidx + replacelen);
    if (state === 0) {
      suggestions.push([idx, buffertext, origtext, replacetext, color_list[idx]]);
      replacetext = origtext;
      formats.push([offset + editidx, buffertext.length + replacelen, color_list[idx]]);
    } else if (state === 1) {
      // rejected
      buffertext = '';
      replacetext = origtext;
    } else if (state === 2){
      // accepted
      buffertext = '';
    }
    newtext = newtext.substring(0, offset + editidx) + buffertext + replacetext + newtext.substring(offset + editidx + replacelen);
    offset += replacetext.length + buffertext.length - replacelen;
  }
  editor.setText(newtext, 'api');
  for (var format of formats) {
    var [startidx, length, color] = format;
    editor.formatText(startidx, length, {'color': color});
  }
  $('#suggestions').text('')
  for (var suggestion of suggestions) {
    (function(suggestion) {
      var [idx, buffertext, origtext, replacetext, color] = suggestion;
      var sugdiv = $('<div>').append([
        $('<span>').css('margin-right', '5px').text('✅').click(x => suggestionClicked(idx, true)),
        $('<span>').css('margin-right', '5px').text('❌').click(x => suggestionClicked(idx, false)),
        $('<span>').text(buffertext).css('color', color),
        $('<span>').text(origtext).css('color', color),
        $('<span>').text(' → '),
        $('<span>').text(replacetext),
      ])
      $('#suggestions').append(sugdiv);
    })(suggestion);
    //sugdiv.append = buffertext + origtext + ' → ' + replacetext;
    //document.getElementById('suggestions').append(sugdiv);
  }
  if (suggestions.length > 0) {
    editor.disable()
    $('#instructions').text('Please accept or reject the suggestions above before making any other revisions')
  } else {
    editor.enable()
    $('#instructions').text('')
    if (dataset_idx + 1 < dataset.length) {
      $('#instructions').append($('<button>').css('font-size', '30px').text('Click here when finished editing to move to the next segment').click(x => set_idx(++dataset_idx)))
    } else {
      $('#instructions').append($('<button>').text('Click here when done'))
    }
  }
  //editor.formatText(5, 7, {'color': 'rgb(0,0,255)'});
}

// var text = 'The Peoples Republic of China, abbreviated as China, is a socialist country in East Asia, founded in Oct 1, 1949, its capital is Beijing.';
// var edits = [
//   [4, 7, "People's"],
//   [90, 7, 'established'],
//   [112, 5, '. Its'],
// ];




//updateText(text, edits, edit_states);


// function clicked1() {
//   updateText(text, edits, [2,2,2]);

// }

// function clicked2() {
//   updateText(text, edits, [1,1,1]);

// }

set_idx(0);