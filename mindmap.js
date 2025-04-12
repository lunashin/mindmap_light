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



/* 内部リストデータ
  [
    { id: n, text: "xxx", color: "", parent: n, children: [n,n,n], deep: n, } ...
  ]
 */
// var g_list_data = [];
var g_list_data = {
  "0": {id: 0, text: "root", parent: -1, children: [], color: '#FFFFFF'}, 
};

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
// コピー
document.getElementById('copy_json_btn').addEventListener('click', click_handler_copy_json);

function click_handler_copy_json(event) {
  copy_json();
}

// インポート
document.getElementById('import_json_btn').addEventListener('click', click_handler_import_json);

function click_handler_import_json(event) {
  let json_str = document.getElementById('import_json_text').value;
  import_json(json_str);
  show_item_all();
}

// Save/Load
document.getElementById('save_json_btn').addEventListener('click', click_handler_save);
document.getElementById('load_json_btn').addEventListener('click', click_handler_load);

function click_handler_save(event) {
  let yesno = confirm('現在の状態を保存しますか？');
  if (yesno) {
    save_json();
    alert('現在の状態を保存しました。');
  }
}

function click_handler_load(event) {
  let yesno = confirm('現在の状態を破棄して読み込みますか？');
  if (yesno) {
    load_json();
    show_item_all();
  }
}


// 要素のキーハンドラ
function keyhandler_item(event) {
  switch (event.keyCode){
    case key_a:    // a
      event.preventDefault();
      // 要素追加
      show_edit_box(event.target, 'add');
      break;
    case key_enter:    // Enter
      event.preventDefault();
      show_edit_box(event.target, 'add');
      break;
    case key_d:       // d
      event.preventDefault();
      remove_item(this.dataset.id);
      show_item_all();
      break;
    case key_e:       // e
      event.preventDefault();
      show_edit_box(event.target, 'edit');
      break;
    case key_0:       // 0
      set_color(this.dataset.id, '#FFFFFF');
      show_item_all();
      break;
    case key_1:       // 1
      set_color(this.dataset.id, '#FFFF99');
      show_item_all();
      break;
    case key_2:       // 2
      set_color(this.dataset.id, '#33CCFF');
      show_item_all();
      break;
    case key_3:       // 3
      set_color(this.dataset.id, '#FF6699');
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
 * @summary 新しい要素を追加
 * @param 親要素ID
 * @param テキスト
 */
function add_new_item(parent_id, text) {
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
 * @summary 色設定
 * @param ID
 * @param テキスト
 */
function set_text(id, text) {
  let item = get_item(id);
  item.text = text;
}

/**
 * @summary 色設定
 * @param ID
 * @param 色(ex '#FFFFFF')
 */
function set_color(id, color) {
  let item = get_item(id);
  item.color = color;
}

/**
 * @summary 要素削除
 * @param ID
 * @param (通常は指定しない)
 */
function remove_item(id, is_nest) {
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
 * @summary 子要素を削除
 * @param 要素
 */
function remove_children(item) {
  if (item.children.length <= 0) {
    return;
  }

  // 子要素を削除
  for (let i = 0; i < item.children.length; i++) {
    remove_children(g_list_data[item.children[i]]);
  }
  item.children = [];
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
  let json_obj = JSON.parse(json_str);
  if (json_obj !== null) {
    g_list_data = json_obj;
    update_last_id(); // 最後のIDを計算
  }
}

/**
 * @summary 内部データのJSON文字列を取得
 * @param JSON文字列
 */
function get_json_string() {
  return JSON.stringify(g_list_data, null , "  ");
}

/**
 * @summary 内部データ保存
 */
function save_json() {
  let json_str = get_json_string();
  saveStorage(key_internal_data, json_str);
}

/**
 * @summary 内部データ読み込み
 */
function load_json() {
  pushHistory(get_json_string());

  let data = loadStorage(key_internal_data);
  import_json(data);
}





//---------------------------------------
// Function
//---------------------------------------

/**
 * @summary 全てを描画
 */
function show_item_all() {
  // clear_canvas();
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
 * @summary 表示を全クリア
 */
function clear_canvas() {
  // document.getElementById('canvas').innerHTML = '';

  // Linerクリア
  for (let i = 0; i < g_lines.length; i++) {
    g_lines[i].remove();
  }
  g_lines = [];
}

/**
 * @summary BOXを配置
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
 * @summary IDから要素IDを取得
 * @param ID
 */
function get_element_id(id) {
  return "item_" + id;
}

/**
 * JSONをコピー
 */
function copy_json(){
  let str = get_json_string();
  copy_text(str);
}




//---------------------------------------
// Main
//---------------------------------------

update_last_id();

// 要素描画
show_item_all();