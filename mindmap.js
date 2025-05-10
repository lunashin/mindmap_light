//---------------------------------------
// Global
//---------------------------------------



//---------------------------------------
// Data
//---------------------------------------

const g_top_base = 100;
const g_left_base = 100;
const g_top_margin = 50;
const g_left_margin = 150;


// localStrage Key
const prefix = 'mindmap_';
const key_internal_data = prefix + 'data';

// Download filename
const g_download_filename_prefix = 'mindmap_json';

// Data Manager
var g_data = new DataManager();

// Color
const g_color_yellow = '#FFFF99';
const g_color_blue = '#33CCFF'
const g_color_green = '#99FF99'
const g_color_red = '#FF6699'

// Cut mark
g_mark_cut_id = -1;




//---------------------------------------
// Event
//---------------------------------------

// Show message Before Close Browwer
window.onbeforeunload = function(e) {
  return "";
}






//---------------------------------------
// Key Event
//---------------------------------------

// key handler (window)
document.addEventListener('keydown', keyhandler_window);

// JSONコピー
document.getElementById('copy_json_btn').addEventListener('click', click_handler_copy_json);

function click_handler_copy_json(event) {
  copy_json();
}

// JSONインポート
document.getElementById('import_json_btn').addEventListener('click', click_handler_import_json);

function click_handler_import_json(event) {
  let json_str = document.getElementById('import_json_text').value;
  g_data.import_json(json_str);
  draw_item_all(true);
}

// Save
document.getElementById('save_json_btn').addEventListener('click', click_handler_save);

function click_handler_save(event) {
  // キーの数を確認
  let key_num = g_data.get_item_num();
  if (key_num <= 1) {
    // キーが１つだけの場合はrootのみのため、何もしない
    alert('rootのみの為、保存をキャンセルしました。');
    return;
  }
  
  let slot_info = get_selected_save_slot();
  let yesno = confirm(`現在の状態を [${slot_info.title}] へ保存しますか？`);
  if (yesno) {
    g_data.save_json(slot_info.id);
    alert('現在の状態を保存しました。');
  }
}

// Load
document.getElementById('load_json_btn').addEventListener('click', click_handler_load);

function click_handler_load(event) {
  let slot_info = get_selected_save_slot();
  let yesno = confirm(`現在の状態を破棄して [${slot_info.title}] から読み込みますか？`);
  if (yesno) {
    clear_canvas(true);
    g_data.load_json(slot_info.id);
    draw_item_all(true);
  }
}

// JSON Download
document.getElementById('download_json_btn').addEventListener('click', click_handler_download);

function click_handler_download(event) {
  let json_str = g_data.get_json_string();
  let date_str = get_today_str(false, true, true);
  let slot_info = get_selected_save_slot();
  let filename = `${g_download_filename_prefix}_${slot_info.id}_${date_str}.json`;
  download_json(filename, json_str);
}

// Clear canvas
document.getElementById('clear_canvas').addEventListener('click', click_handler_clear_canvas);

function click_handler_clear_canvas(event) {
  clear_canvas();
  g_data.import_json(JSON.stringify(g_data.g_list_data_init));
  draw_item_all(true);
}

// Copy Talbe
document.getElementById('copy_table').addEventListener('click', click_handler_copy_table);

function click_handler_copy_table(event) {
  copy_html_table();
}

// windowのキーハンドラ
function keyhandler_window(event) {
  switch (event.keyCode){
    case key_z:       // z
      if (event.ctrlKey) {
        event.preventDefault();
        if (getHistoryNum() > 0) {
          clear_canvas();
          g_data.undo();
          draw_item_all(true);
        }
      }
      break;
    case key_esc:     // ESC
      clear_mark_cut();
      break;
  }
}


// 要素のキーハンドラ
function keyhandler_item(event) {
  let id = event.target.dataset.id;
  // let parent_id = event.target.dataset.parent_id;

  console.log(event.keyCode, event.shiftKey, event.ctrlKey, event.altKey);

  switch (event.keyCode){
    case key_arrow_up:    // ↑
      if (event.altKey) {
        event.preventDefault();
        // 子要素の順番変更
        g_data.change_order_children(id, true);
        draw_item_all();
        break;
      }
      // 前の子要素へフォーカス移動
      event.preventDefault();
      let prev_id = g_data.get_neighbor_id(id, true);
      if (prev_id!== null) {
        set_focus(prev_id);
      }
      break;
    case key_arrow_down:  // ↓
      if (event.altKey) {
        event.preventDefault();
        // 子要素の順番変更
        g_data.change_order_children(id, false);
        draw_item_all();
        break;
      }
      // 後ろの子要素へフォーカス移動
      event.preventDefault();
      let next_id = g_data.get_neighbor_id(id, false);
      if (next_id !== null) {
        set_focus(next_id);
      }
      break;
    case key_arrow_left:  // ←
      // 親要素へフォーカス移動
      set_focus(g_data.get_item(id).parent);
      break;
    case key_arrow_right:  // →
      // 子要素へフォーカス移動
      let item = g_data.get_item(parseInt(id));
      if (item.children.length <= 0) {
        break;
      }
      set_focus(item.children[0]);
      break;
    case key_a:    // a
      event.preventDefault();
      // 要素追加
      show_edit_box(event.target, 'add');
      break;
    case key_enter:    // Enter
      event.preventDefault();
      if (event.ctrlKey) {
        show_edit_box(event.target, 'edit');
        break;
      }
      show_edit_box(event.target, 'add');
      break;
    case key_c:       // c
      if (event.altKey) {
        event.preventDefault();
        copy_json(id);    // Copy JSON Bottom this
        break;
      }
      if (event.ctrlKey) {
        event.preventDefault();
        copy_sub_items_json(id);
      }
      break;
    case key_d:       // d
      event.preventDefault();
      // g_data.remove_item_ex(id);
      g_data.remove_item(id)
      draw_item_all();
      break;
    case key_e:       // e
      event.preventDefault();
      show_edit_box(event.target, 'edit');
      break;
    case key_i:       // i
      // 要素挿入
      event.preventDefault();
      show_edit_box(event.target, 'insert');
      break;
    case key_v:       // v
      if (event.ctrlKey) {
        event.preventDefault();
        // 選択中ID配下へカット対象を付け替え
        if (g_mark_cut_id !== -1) {
          g_data.chage_parent(g_mark_cut_id, id);
          draw_item_all();
          clear_mark_cut();
        }
        break;
      }
      break;
    case key_x:       // x
      mark_cut(id);
      break;
    case key_0:       // 0
      g_data.set_color(id, null);
      draw_item_all();
      break;
    case key_1:       // 1
      g_data.set_color(id, g_color_yellow);
      draw_item_all();
      break;
    case key_2:       // 2
      g_data.set_color(id, g_color_blue);
      draw_item_all();
      break;
    case key_3:       // 3
      g_data.set_color(id, g_color_green);
      draw_item_all();
      break;
    case key_4:       // 4
      g_data.set_color(id, g_color_red);
      draw_item_all();
      break;
    case key_plus:       // +
      if (event.shiftKey) {
        event.preventDefault();
        g_data.set_size(id, 'middle');
        draw_item_all();
        break;
      }
      break;
    case key_astar:       // *
      if (event.shiftKey) {
        event.preventDefault();
        g_data.set_size(id, 'big');
        draw_item_all();
        break;
      }
      break;
  }
}

/**
 * 要素ダブルクリック
 */
function dblclick_handler_item(event) {
  show_edit_box(event.target, 'add');
}

/**
 * @summary 要素トランジション開始時処理
 */
function transitionStart_handler(event) {
  let item = g_data.get_item(this.dataset.id);
  if (item.line !== undefined) {
    // lineを削除
    item.line.remove();
    delete item.line;
  }
}

/**
 * @summary 要素トランジション終了時処理
 */
function transitionEnd_handler(event) {
  let item = g_data.get_item(this.dataset.id);
  item.line = create_line(document.getElementById(get_element_id(item.parent)), this);
}









//---------------------------------------
// Function
//---------------------------------------

/**
 * @summary 全てを描画
 * @param キャンバスをクリアするかどうか
 */
function draw_item_all(is_clear_canvas) {
  if(is_clear_canvas) {
    clear_canvas();
  }
  draw_item(0, -1, g_top_base, g_left_base);
}

/**
 * @summary 要素を描画 (配下要素すべて)
 * @param root ID
 * @param 基底TOP
 * @param 基底LEFT
 * @returns 最後に描画した要素のTOP
 */
function draw_item(id, parent_id, base_top, base_left) {
  let item = g_data.get_item(id);

  let elem = document.getElementById(get_element_id(id));
  if (elem !== null) {
    // すでに要素が存在する場合は、既存要素を変更
    elem.innerHTML = item.text;
    elem.style.backgroundColor = item.color;
    elem.style.top = base_top;
    elem.style.left = base_left;
    if (item.size !== '') {
      elem.classList.remove('middle');
      elem.classList.remove('big');
      elem.classList.add(item.size);
    } else {
      elem.classList.remove('middle');
      elem.classList.remove('big');
    }
  } else {
    // 要素作成
    elem = create_box(item.id, item.parent, item.text, item.size, base_top, base_left, item.color);
    let elem_parent = document.getElementById(get_element_id(parent_id));
    if (elem_parent !== null) {
      item.line = create_line(elem_parent, elem); // 線を引く
    }
  }

  // 子要素を描画 (再帰)
  let top_sub = base_top;
  let top_last = base_top;
  for (let i = 0; i < item.children.length; i++) {
    top_last = draw_item(item.children[i], id, top_sub, base_left + g_left_margin);
    top_sub = top_last + g_top_margin;
  }

  return top_last;
}

/**
 * @summary 要素を描画 (配下要素すべて)
 * @param root ID
 * @param 基底TOP
 * @param 基底LEFT
 * @returns 最後に描画した要素のTOP
 */
function make_table_html(id, parent_id, row, col) {
  let item = g_data.get_item(id);

  // 子要素を描画 (再帰)
  for (let i = 0; i < item.children.length; i++) {
    row_last = draw_item(item.children[i], id, row, col+1);
    top_sub = row_last + 1;
  }

  return top_last;
}

/**
 * @summary 要素div削除
 * @param ID
 */
function remove_item_div(id) {
  let item = g_data.get_item(id);
  document.getElementById(get_element_id(id)).remove();
  item.line.remove();
}

/**
 * @summary 表示を全クリア
 */
function clear_canvas() {
  // div要素を削除
  document.getElementById('canvas').innerHTML = '';

  // 全てのLineを削除
  g_data.remove_all_line();
}

/**
 * @summary 要素を配置
 * @param ID
 * @param 親要素ID
 * @param テキスト
 * @param 描画位置(TOP)
 * @param 描画位置(LEFT)
 * @returns 要素
 */
function create_box(id, parent_id, text, size, top, left, color) {
  // 要素を作成
  let elem = document.createElement('div');
  elem.id = get_element_id(id);
  elem.innerHTML = text;
  elem.dataset.id = id;
  // elem.dataset.parent_id = parent_id;
  elem.tabIndex = 1;
  elem.style.top = top;
  elem.style.left = left;
  elem.style.backgroundColor = color;
  elem.classList.add('item');
  if (size !== undefined && size !== '') {
    elem.classList.add(size);
  }
  elem.addEventListener("keydown", keyhandler_item);
  elem.addEventListener("dblclick", dblclick_handler_item);
  elem.addEventListener("transitionstart", transitionStart_handler);
  elem.addEventListener("transitionend", transitionEnd_handler);

  // canvas divへ追加
  document.getElementById('canvas').appendChild(elem);

  return elem;
}

/**
 * @summary 線を描く
 * @param 要素1
 * @param 要素2
 * @returns オブジェクト
 */
function create_line(elem1, elem2) {
  return new LeaderLine(elem1, elem2, {path: 'fluid', startSocket: 'right', endSocket: 'left'});
}

/**
 * @summary テキストボックス作成
 * @param 親要素
 * @param モード('add', 'edit', 'insert')
 */
function show_edit_box(elem_parent, mode) {
  let elem = document.createElement('input');
  // 属性
  elem.type = 'text';
  elem.dataset.parent_id = elem_parent.dataset.id;
  elem.dataset.mode = mode;
  // テキスト
  if (mode === 'edit') {
    elem.value = elem_parent.innerText;
  }

  // 位置
  let rect_parent = elem_parent.getBoundingClientRect();
  elem.style.top = rect_parent.top - 20 + window.scrollY;
  elem.style.left = rect_parent.right;
  elem.style.position = 'absolute';

  // イベントハンドラ(フォーカスロスト)
  // elem.addEventListener("blur", handler_edit_submit);

  // イベントハンドラ(キー)
  elem.addEventListener("keydown", function(event){ 
    // enter
    if (event.keyCode === key_enter) {
      event.preventDefault(); // 既定の動作をキャンセル
      handler_edit_submit(event);
    } 
    // ESC
    if (event.keyCode === key_esc) {
      event.preventDefault(); // 既定の動作をキャンセル
      handler_edit_cancel(event);
    }
  });

  // 要素追加
  document.getElementById('canvas').appendChild(elem);
  // フォーカス移動
  elem.focus();
}

/**
 * @summary エディットボックス 決定
 */
function handler_edit_submit(event) {
  // テキスト取得
  let text = event.target.value;
  // モード
  let mode = event.target.dataset.mode;
  // 親ID
  let parent_id = event.target.dataset.parent_id;
  // 要素削除
  event.target.remove();
  // 要素追加
  if (text !== '') {
    if (mode === 'add') {
      g_data.add_new_item(event.target.dataset.parent_id, text);
    }
    if (mode === 'edit') {
      g_data.set_text(event.target.dataset.parent_id, text);
    }
    if (mode === 'insert') {
      g_data.insert_item(event.target.dataset.parent_id, text);
    }
    draw_item_all();
  }
  // フォーカス
  document.getElementById(get_element_id(parent_id)).focus();
}

/**
 * @summary エディットボックス キャンセル
 */
function handler_edit_cancel(event) {
  event.target.value = '';
  event.target.remove();

  // フォーカスを戻す
  let parent_id = event.target.dataset.parent_id;
  document.getElementById(get_element_id(parent_id)).focus();
}

/**
 * @summary 指定IDへフォーカス移動
 * @param ID
 */
function set_focus(id) {
  document.getElementById(get_element_id(id)).focus();
}

/**
 * @summary IDから要素IDを取得
 * @param ID
 */
function get_element_id(id) {
  return "item_" + id;
}

/**
 * @summary JSONをコピー(ID指定の場合は、指定IDをルートとする)
 * @param ID
 */
function copy_json(id){
  let str = g_data.get_json_string();
  copy_text(str);
}

/**
 * @summary テーブルをコピー(エクセル用)
 */
function copy_html_table() {
  let html = g_data.get_html_table();
  const item = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' })
  });
  navigator.clipboard.write([item]);
}


/**
 * @summary 保存スロット選択リスト設定
 */
function set_save_slot_select() {
  let elem_select = document.getElementById('select_save_slot');
  for (let i = 0; i < g_save_slot.length; i++) {
    let elem_option = document.createElement("option");
    elem_option.text = g_save_slot[i].name;
    elem_option.dataset.id = g_save_slot[i].id;
    elem_select.appendChild(elem_option);
  }
}

/**
 * @summary 選択している保存スロットID取得
 * @returns {title: タイトル, id: スロットID}
 */
function get_selected_save_slot() {
  let elems = get_selected_option('select_save_slot');
  if (elems.length <= 0) {
    return;
  }
  return  {title: elems[0].text, id: elems[0].dataset.id};
}

/**
 * @summary 指定ID配下要素のJSONをコピー
 */
function copy_sub_items_json(id) {
  // 指定ID配下のJSON取得
  let json_str_sub = g_data.get_sub_items_json(id);
  // コピー
  copy_text(json_str_sub);
}

/**
 * @summary カット対象としてマーク
 * @param {*} id 
 */
function mark_cut(id) {
  g_mark_cut_id = id;
  document.getElementById('text_cut_mark_id').value = g_data.get_item(id).text;
}

/**
 * @summary カット対象をクリア
 */
function clear_mark_cut() {
  g_mark_cut_id = -1;
  document.getElementById('text_cut_mark_id').value = '';
}





//---------------------------------------
// Main
//---------------------------------------

// 保存スロット選択初期化
set_save_slot_select();

// 要素描画
draw_item_all();