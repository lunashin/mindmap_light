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


/* 内部リストデータ
  [
    { id: n, text: "xxx", color: "", parent: n, children: [n,n,n], deep: n, } ...
  ]
 */
// var g_list_data = [];

// 初期データ
const g_list_data_init = {
  "0": {id: 0, text: "root", parent: -1, children: [], color: ''}, 
};

// 内部データ
var g_list_data = {
  "0": {id: 0, text: "root", parent: -1, children: [], color: ''}, 
};;

// LeaderLine
var g_lines = [];

// 内部リスト 次回追加時のID
var g_last_group_id = 10000;
var g_last_id = 0;


// 編集履歴
var g_list_history = [];
const g_list_history_num = 20;

// 編集ポップアップ表示状態
var g_show_popup = false;
var g_show_popup_list = '';




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
  import_json(json_str);
  show_item_all(true);
}

// Save
document.getElementById('save_json_btn').addEventListener('click', click_handler_save);

function click_handler_save(event) {
  // キーの数を確認
  let key_num = get_item_num();
  if (key_num <= 1) {
    // キーが１つだけの場合はrootのみのため、何もしない
    alert('rootのみの為、保存をキャンセルしました。');
    return;
  }
  
  let yesno = confirm('現在の状態を洗濯中のスロットへ保存しますか？');
  if (yesno) {
    let slot_id = get_selected_save_slot();
    save_json(slot_id);
    alert('現在の状態を保存しました。');
  }
}

// Load
document.getElementById('load_json_btn').addEventListener('click', click_handler_load);

function click_handler_load(event) {
  let yesno = confirm('現在の状態を破棄して洗濯中のスロットから読み込みますか？');
  if (yesno) {
    clear_canvas(true);
    let slot_id = get_selected_save_slot();
    load_json(slot_id);
    show_item_all(true);
  }
}

// JSON Download
document.getElementById('download_json_btn').addEventListener('click', click_handler_download);

function click_handler_download(event) {
  let json_str = get_json_string();
  let date_str = get_today_str(false, true, true);
  let slot_id = get_selected_save_slot();
  let filename = `${g_download_filename_prefix}_${slot_id}_${date_str}.json`;
  download_json(filename, json_str);
}

// Clear canvas
document.getElementById('clear_canvas').addEventListener('click', click_handler_clear_canvas);

function click_handler_clear_canvas(event) {
  clear_canvas();
  import_json(JSON.stringify(g_list_data_init));
  show_item_all(true);
}



// windowのキーハンドラ
function keyhandler_window(event) {
  switch (event.keyCode){
    case key_z:       // z
    if (event.ctrlKey) {
      event.preventDefault();
      if (getHistoryNum() > 0) {
        clear_canvas();
        undo();
        show_item_all(true);
      }
    }
    break;
  }
}


// 要素のキーハンドラ
function keyhandler_item(event) {
  let id = event.target.dataset.id;
  let parent_id = event.target.dataset.parent_id;

  switch (event.keyCode){
    case key_arrow_up:    // ↑
      if (event.altKey) {
        event.preventDefault();
        // 子要素の順番変更
        change_order_children(id, true);
        show_item_all();
        break;
      }
      break;
    case key_arrow_down:  // ↓
      if (event.altKey) {
        event.preventDefault();
        // 子要素の順番変更
        change_order_children(id, false);
        show_item_all();
        break;
      }
      break;
    case key_arrow_left:  // ←
      // 親要素へフォーカス移動
      set_focus(parseInt(parent_id));
      break;
    case key_arrow_right:  // →
      // 子要素へフォーカス移動
      let item = get_item(parseInt(id));
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
      show_edit_box(event.target, 'add');
      break;
    case key_c:       // c
      if (event.altKey) {
        event.preventDefault();
        // Copy JSON Bottom this
        copy_json(id);
      }
      break;
    case key_d:       // d
      event.preventDefault();
      remove_item(id);
      show_item_all();
      break;
    case key_e:       // e
      event.preventDefault();
      show_edit_box(event.target, 'edit');
      break;
    case key_0:       // 0
      set_color(id, null);
      show_item_all();
      break;
    case key_1:       // 1
      set_color(id, '#FFFF99');
      show_item_all();
      break;
    case key_2:       // 2
      set_color(id, '#33CCFF');
      show_item_all();
      break;
    case key_3:       // 3
      set_color(id, '#FF6699');
      show_item_all();
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
  let item = g_list_data[this.dataset.id];
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
  let item = g_list_data[this.dataset.id];
  item.line = create_line(document.getElementById(get_element_id(this.dataset.parent_id)), this);
}








//---------------------------------------
// Function(Data)
//---------------------------------------

/**
 * @summary 指定IDの要素を取得
 * @param ID
 */
function get_item(id) {
  return g_list_data[id];
}

/**
 * @summary 要素の数を取得
 * @returns 要素の数
 */
function get_item_num() {
  return Object.keys(g_list_data).length;
}

/**
 * @summary 新しい要素を追加
 * @param 親要素ID
 * @param テキスト
 */
function add_new_item(parent_id, text) {
  pushHistory(get_json_string());

  let id = genItemID();
  let item = make_item(id, parent_id, text);
  g_list_data[id] = item;
  g_list_data[parent_id].children.push(id);
}

/**
 * @summary 要素を作成
 * @param ID
 * @param 親要素ID
 * @param テキスト
 */
function make_item(id, parent_id, text) {
  return { id: id, text: text, color: "", parent: parent_id, children: [] };
}

/**
 * @summary テキスト設定
 * @param ID
 * @param テキスト
 */
function set_text(id, text) {
  pushHistory(get_json_string());

  let item = get_item(id);
  item.text = text;
}

/**
 * @summary 色設定
 * @param ID
 * @param 色(ex '#FFFFFF') (nullは色なし)
 */
function set_color(id, color) {
  pushHistory(get_json_string());

  let item = get_item(id);
  if (color === null) {
    item.color = '';
  } else {
    item.color = color;
  }
}

/**
 * @summary 要素削除
 * @param ID
 * @param (通常は指定しない)
 */
function remove_item(id, is_nest) {
  if (is_nest === undefined) {
    pushHistory(get_json_string());
  }

  let item = get_item(id);
  let parent_id = item.parent;

  // 子要素を削除
  for (let i = 0; i < item.children.length; i++) {
    remove_item(item.children[i], true);
  }

  // 要素divを削除
  remove_item_div(id);

  // 自身を削除
  delete g_list_data[id];

  // 親要素の子要素から指定IDを削除 (再起終了後)
  if (is_nest === undefined) {
    let item_parent = get_item(parent_id);
    for (let i = 0; i < item_parent.children.length; i++) {
      if (item_parent.children[i] == id) {
        item_parent.children.splice(i,1);
      }
    }
  }
}

/**
 * 子要素の中の順番変更
 */
function change_order_children(id, is_up) {
  pushHistory(get_json_string());

  let parent_id = get_item(id).parent;
  let children = get_item(parent_id).children;
  for (let i = 0; i < children.length; i++) {
    if (children[i] == id) {
      if (is_up && i !== 0) {
        [children[i], children[i-1]] = [children[i-1], children[i]]
      }
      if (!is_up && i !== children.length - 1) {
        [children[i], children[i+1]] = [children[i+1], children[i]]
      }
      break;
    }
  }
}

/**
 * @summary 新しいアイテムIDを発行する
 * @returns ID
 */
function genItemID() {
  let new_id = g_last_id;
  g_last_id++;
  return new_id;
}

/**
 * @summary 最後のIDを計算
 */
function update_last_id() {
  let last_id = 0;
  let keys = Object.keys(g_list_data);
  for (let i = 0; i < keys.length; i++) {
    let id = parseInt(keys[i]);
    if (last_id < id) {
      last_id = id;
    }
  }
  g_last_id = last_id + 1;
}

/**
 * @summary JSONをインポート
 * @param JSON文字列
 */
function import_json(json_str) {
  pushHistory(get_json_string());

  let json_obj = JSON.parse(json_str);
  if (json_obj !== null) {
    g_list_data = json_obj;
    update_last_id(); // 最後のIDを計算
  }
}

/**
 * @summary JSONをインポート
 * @param JSONオブジェクト
 */
function import_json_ex(json_obj) {
  pushHistory(get_json_string());

  if (json_obj !== null) {
    g_list_data = json_obj;
    update_last_id(); // 最後のIDを計算
  }
}

/**
 * @summary Undo
 */
function undo() {
  let json_obj = popHistory();
  if (json_obj === null) {
    return;
  }
  g_list_data = json_obj;
}

/**
 * @summary 内部データのJSON文字列を取得
 * @param JSON文字列
 */
function get_json_string() {
  let json_str = JSON.stringify(g_list_data, null , "  ");
    // 一度dictを復元し、lineを削除
    let temp_dict = JSON.parse(json_str);
    let keys = Object.keys(temp_dict);
    for (let i = 0; i < keys.length; i++) {
      delete temp_dict[keys[i]].line;
    }
  return JSON.stringify(temp_dict, null , "  ");
}

/**
 * @summary 内部データ保存
 */
function save_json(slot) {
  // JSON文字列取得
  let json_str = get_json_string();
  // 保存
  saveStorage(get_storage_key(slot), json_str);
}

/**
 * @summary 内部データ読み込み
 */
function load_json(slot) {
  pushHistory(get_json_string());

  let data = loadStorage(get_storage_key(slot));
  import_json(data);
}

/**
 * @summary storageへアクセスするキー取得
 */
function get_storage_key(slot) {
  return key_internal_data + '_' + slot;
}




//---------------------------------------
// Function
//---------------------------------------

/**
 * @summary 全てを描画
 * @param キャンバスをクリアするかどうか
 */
function show_item_all(is_clear_canvas) {
  if(is_clear_canvas) {
    clear_canvas();
  }
  show_item(0, -1, g_top_base, g_left_base);
}

/**
 * @summary 要素を描画
 * @param ID
 * @param 基底TOP
 * @param 基底LEFT
 * @returns 最後に描画した要素のTOP
 */
function show_item(id, parent_id, base_top, base_left) {
  let item = get_item(id);

  let elem = document.getElementById(get_element_id(id));
  if (elem !== null) {
    // すでに要素が存在する場合は、座標指定のみ
    elem.innerHTML = item.text;
    elem.style.backgroundColor = item.color;
    elem.style.top = base_top;
    elem.style.left = base_left;
  } else {
    // 要素作成
    elem = create_box(item.id, item.parent, item.text, base_top, base_left, item.color);
    let elem_parent = document.getElementById(get_element_id(parent_id));
    if (elem_parent !== null) {
      item.line = create_line(elem_parent, elem);
    }
  }

  // 子要素を描画
  let top_sub = base_top;
  let top_last = base_top;
  for (let i = 0; i < item.children.length; i++) {
    top_last = show_item(item.children[i], id, top_sub, base_left + g_left_margin);
    top_sub = top_last + g_top_margin;
  }

  return top_last;
}

/**
 * @summary 要素div削除
 * @param ID
 */
function remove_item_div(id) {
  let item = get_item(id);
  document.getElementById(get_element_id(id)).remove();
  item.line.remove();
}

/**
 * 全てのLineを削除
 */
function remove_all_line() {
  let keys = Object.keys(g_list_data);
  for (let i = 0; i <  keys.length; i++) {
    let item = g_list_data[keys[i]];
    if (item.line !== undefined) {
      item.line.remove();
      delete item.line;
    }
  }
}

/**
 * @summary 表示を全クリア
 */
function clear_canvas() {
  // div要素を削除
  document.getElementById('canvas').innerHTML = '';

  // 全てのLineを削除
  remove_all_line();
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
function create_box(id, parent_id, text, top, left, color) {
  // 要素を作成
  let elem = document.createElement('div');
  elem.id = get_element_id(id);
  elem.innerHTML = text;
  elem.dataset.id = id;
  elem.dataset.parent_id = parent_id;
  elem.tabIndex = 1;
  elem.style.top = top;
  elem.style.left = left;
  elem.style.backgroundColor = color;
  elem.classList.add('item');
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
 * @param モード('add', 'edit')
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
  elem.style.top = rect_parent.top - 20;
  elem.style.left = rect_parent.right;
  elem.style.position = 'absolute';

  // イベントハンドラ(フォーカスロスト)
  elem.addEventListener("blur", handler_edit_submit);

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
      add_new_item(event.target.dataset.parent_id, text);
    }
    if (mode === 'edit') {
      set_text(event.target.dataset.parent_id, text);
    }
    show_item_all();
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
  let str = get_json_string();
  copy_text(str);
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
 * @returns スロットID
 */
function get_selected_save_slot() {
  let elems = get_selected_option('select_save_slot');
  if (elems.length <= 0) {
    return;
  }
  return elems[0].dataset.id;
}



//---------------------------------------
// Main
//---------------------------------------

// 最後のIDを計算
update_last_id();

// 保存スロット選択初期化
set_save_slot_select();

// 要素描画
show_item_all();