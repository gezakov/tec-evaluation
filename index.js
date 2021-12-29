//console.log('hello world')

// function add_random_assignments() {
//   for (var idx = 0; idx < dataset.length; ++idx) {
//     dataset[idx].cond = Math.round(Math.random())
//   }
// }
function main() {

  var search_params = new URLSearchParams(window.location.search);
  var email = search_params.get('email')
  if (email === undefined || email === null || email.trim().length === 0 || email.indexOf('@') === -1) {
    $('#interface').text('You did not click the correct URL. Please check your email for the correct URL.')
    return
  }


  var dataset_idx = parseInt(localStorage.dataset_idx)
  if (isNaN(dataset_idx)) {
    dataset_idx = 0;
    localStorage.dataset_idx = 0;
  }

  var logitems = [];

  function addlog(logitem) {
    logitem.idx = dataset_idx
    logitem.time = Date.now();
    logitems.push(logitem);
    console.log(logitem)
  }

  addlog({evt: 'loadpage'});

  var container = document.getElementById('editor');
  var editor = new Quill(container);

  editor.on('text-change', function(change, prev, source) {
    if (source !== 'user') {
      return
    }
    addlog({evt: 'edit', ops: change.ops})
  });

  // [chr(ord('❶')+idx) for idx in range(10)]
  var buffertext_list = ['❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿'];

  var color_list = [
    'rgb(0,0,255)',
    'rgb(255,0,0)',
    'rgb(0,255,0)',
  ]

  // var dataset = [
  //   {
  //     src: '中华人民共和国，建成中国，是一个位于东亚的社会主义国家，成立于1949年10月1日，首都为北京市',
  //     tgt: 'The Peoples Republic of China, abbreviated as China, is a socialist country in East Asia, founded in Oct 1, 1949, its capital is Beijing.',
  //     edits: [
  //       [4, 7, "People's"],
  //       [90, 7, 'established'],
  //       [112, 5, '. Its'],
  //     ]
  //   },
  //   {
  //     src: '越南是位于东南亚的中南半岛东端的社会主义国家',
  //     tgt: 'Viet Nam is a socialist country located in south east Asia.',
  //     edits: [
  //       [0, 8, "Vietnam"],
  //       [43, 10, 'Southeast'],
  //     ]
  //   },
  // ]

  function finish_current() {
    addlog({evt: 'done', final_text: editor.getText()});
    // TODO need to send off logs here
    localStorage['log' + dataset_idx] = JSON.stringify(logitems);
    logitems = [];
  }

  function show_done() {
    $('#interface').text('');
    $('#interface').append($('<div>').text('You are now done. Click the button below to download your results and email them back:'));
    $('#interface').append($('<button>').css({'font-size': '30px', 'cursor': 'pointer'}).text('Download results').click(x => {alert('TODO this is not yet implemented');}));
    $('#interface').append($('<div>').text('If the above download button does not work, press this button and copy-paste the text and email it back'));
    $('#interface').append($('<button>').css({'font-size': '30px', 'cursor': 'pointer'}).text('Show results').click(x => {$('#interface').text(JSON.stringify(localStorage))}));
  }

  function next_idx() {
    localStorage.dataset_idx = ++dataset_idx;
    set_idx(dataset_idx);
  }

  function set_idx(dataset_idx) {
    var info = dataset[dataset_idx];
    var srctext = info.src;
    var text = info.tgt;
    var cond = Math.round(Math.random())
    var edits = info.edits;
    var edit_states = edits.map(x => 0);
    if (cond === 0) {
      // control condition, do not show any suggestions
      edits = [];
      edit_states = [];
    }
    document.getElementById('srctxt').innerText = srctext;
    document.getElementById('segment-id').innerText = `Segment ${dataset_idx} / ${dataset.length}`;
    document.getElementById('segment-condition').innerText = cond ? "🟨 Suggestions shown" : "⬜️ Suggestions hidden (if any)";
    updateText(text, edits, edit_states);
    addlog({evt: 'set_idx', src: srctext, tgt: text, edits: edits, cond: cond, email: email});
  }

  //var srctext = '中华人民共和国，建成中国，是一个位于东亚的社会主义国家，成立于1949年10月1日，首都为北京市';




  function updateText(text, edits, edit_states) {

    function suggestionClicked(idx, is_accept) {
      if (is_accept) {
        edit_states[idx] = 2
      } else {
        edit_states[idx] = 1
      }
      updateText(text, edits, edit_states);
      addlog({evt: 'suggest', accept: is_accept, sugg_idx: idx, new_states: edit_states});
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
          $('<span>').css({'margin-right': '5px', 'cursor': 'pointer'}).text('✅').click(x => suggestionClicked(idx, true)),
          $('<span>').css({'margin-right': '5px', 'cursor': 'pointer'}).text('❌').click(x => suggestionClicked(idx, false)),
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
        $('#instructions').append($('<button>').css({'font-size': '30px', 'cursor': 'pointer'}).text('Click here when finished editing to move to the next segment').click(function(x) {finish_current(); next_idx();}))
      } else {
        $('#instructions').append($('<button>').css({'font-size': '30px', 'cursor': 'pointer'}).text('Click here when done')).click(function(x) {finish_current(); localStorage.is_done = 'true'; show_done();})
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

  if (localStorage.is_done === 'true') {
    show_done();
  } else {
    set_idx(dataset_idx);
  }

}

main();
