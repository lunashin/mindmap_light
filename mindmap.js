//---------------------------------------
// Global
//---------------------------------------



//---------------------------------------
// Data
//---------------------------------------

const g_top_base = 100;     // root位置(Y)
const g_left_base = 1000;   // root位置(X)
const g_top_margin = 50;    // 縦の間隔
const g_left_margin = 150;  // 横の間隔
const g_left_margin_ex = 50;  // 横の間隔(要素間が詰まる場合)
const edit_cols = '20';     // editのサイズ(横)
const edit_rows = '2';      // editのサイズ(縦)
const g_canvas_width = 5000;  // キャンバスサイズ(横)
const g_canvas_height = 5000; // キャンバスサイズ(縦)


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
const g_color_grey = '#777777'

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
  let parent = event.target.dataset.parent_id;

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
      if(event.shiftKey) {
        // 左へ配置(root直下の場合)
        if (g_data.get_item(id).parent == 0) {
          g_data.set_direction(id, 'left');
          draw_item_all();
        }
        break;
      }
      // 親要素へフォーカス移動
      set_focus(g_data.get_item(id).parent);
      break;
    case key_arrow_right:  // →
      if(event.shiftKey) {
        // 右へ配置(root直下の場合)
        if (g_data.get_item(id).parent == 0) {
          g_data.set_direction(id, 'right');
          draw_item_all();
        }
        break;
      }
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
      show_edit_box(id, 'textarea', 'add', 'text');
      break;
    case key_b:    // b
      event.preventDefault();
      // 太字設定
      g_data.toggle_bold(id);
      draw_item_all();
      break;
    case key_enter:    // Enter
      event.preventDefault();
      if (event.ctrlKey) {
        show_edit_box(id, 'textarea', 'edit', 'text');
        break;
      }
      show_edit_box(id, 'textarea', 'add', 'text');
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
      show_edit_box(id, 'textarea', 'edit', 'text');
      break;
    case key_i:       // i
      // 要素挿入
      event.preventDefault();
      show_edit_box(id, 'textarea', 'insert', 'text');
      break;
    case key_l:       // L
      // URL設定
      event.preventDefault();
      show_edit_box(id, 'edit', 'edit', 'url');
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
    case key_5:       // 5
      g_data.set_color(id, g_color_grey);
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
  show_edit_box(event.target.dataset.id, 'textarea', 'add', 'text');
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
  item.line = create_line(document.getElementById(get_element_id(item.parent)), this, g_data.get_direction(this.dataset.id, true));
}









//---------------------------------------
// Function
//---------------------------------------

/**
 * @summary 初期化
 */
function init() {
  // キャンパスサイズ初期化
  let elem = document.getElementById('canvas');
  elem.style.width = g_canvas_width;
  elem.style.height = g_canvas_height;

  // 保存スロット選択初期化
  set_save_slot_select();

  // 要素描画
  draw_item_all();
}

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
 * @param 展開方向('right'(既定) or 'left')
 * @returns 最後に描画した要素のTOP
 */
function draw_item(id, parent_id, base_top, base_left, direction) {
  // 要素を描画(あれば再配置)
  put_item(id, parent_id, base_top, base_left, direction);
  
  let item = g_data.get_item(id);

  // rootの直下のみ、右方向を先に描画するため、左側を後ろへ並び替え
  if (item.id === 0) {
    item.children.sort((a, b) => {
      let d1 = g_data.get_item(a).direction;
      let d2 = g_data.get_item(b).direction;
      // console.log(a, d1, b, d2);
      if (d1 === undefined) { d1 = 'right'; }
      if (d2 === undefined) { d2 = 'right'; }
      if (d1 !== d2 && d1 === 'left') {return 1;}
      if (d1 !== d2 && d2 === 'left') {return -1;}
      return 0;
    });
  }

  // 子要素を描画 (再帰)
  let is_change_direction = false;
  let top_sub = base_top;
  let top_last = base_top;
  let elem_width = document.getElementById(get_element_id(id)).clientWidth;
  for (let i = 0; i < item.children.length; i++) {
    // 展開方向
    let direction_child = g_data.get_item(item.children[i]).direction;
    if (direction_child === undefined) {
      direction_child = direction;
    }
    let left_margin_coef = 1;
    if (direction_child === 'left') {
      left_margin_coef = -1;
    }

    // 横の間隔調整
    let left_margin = g_left_margin;
    // 要素間の横の間隔が狭い場合は、間隔を調整
    if (g_left_margin - elem_width  < 10) {
      left_margin = elem_width + g_left_margin_ex;
    }

    // root直下で方向が変わった場合はtopをリセット
    if (item.id === 0 && !is_change_direction && direction_child !== direction) {
      top_sub = base_top;
      is_change_direction = true;
    }
    top_last = draw_item(item.children[i], id, top_sub, base_left + left_margin * left_margin_coef, direction_child);
    top_sub = top_last + g_top_margin;
  }

  return top_last;
}

/**
 * @summary 要素を配置 or 位置変更
 * @param ID
 * @param 基底TOP
 * @param 基底LEFT
 * @param 展開方向('right'(既定) or 'left')
 */
function put_item(id, parent_id, base_top, base_left, direction) {
  let item = g_data.get_item(id);
  let elem = document.getElementById(get_element_id(id));

  if (elem !== null) {
    // すでに要素が存在する場合は、既存要素を変更
    let text = item.text.replaceAll('\n', '<br>');
    if (item.url !== undefined && item.url !== '') {
      elem.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    } else {
      elem.innerHTML = text;
    }
    elem.style.backgroundColor = item.color;

    // 位置調整
    let adjusted_pos = get_adjusted_box_pos(base_top, base_left, elem.clientWidth, direction);
    elem.style.top = adjusted_pos.top;
    elem.style.left = adjusted_pos.left;
    // elem.style.top = base_top;
    // elem.style.left = base_left;
    if (item.size !== '') {
      elem.classList.remove('middle');
      elem.classList.remove('big');
      elem.classList.add(item.size);
    } else {
      elem.classList.remove('middle');
      elem.classList.remove('big');
    }
    if (item.is_bold) {
      elem.classList.add('bold');
    } else {
      elem.classList.remove('bold');
    }
  } else {
    // 要素作成
    elem = create_box(id, base_top, base_left, direction);
    let elem_parent = document.getElementById(get_element_id(parent_id));
    if (elem_parent !== null) {
      item.line = create_line(elem_parent, elem, direction); // 線を引く
    }
  }
}

/**
 * @summary 指定ID配下を囲むグループ枠を描画
 * @param root ID
 */
function draw_group_frame(id) {
  // 縦横サイズを計算

  // 色
  
  // 要素を配置

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
 * @param 描画位置(TOP)
 * @param 描画位置(LEFT)
 * @param 展開方向('right'(既定) or 'left')
 * @returns 要素
 */
function create_box(id, top, left, direction) {
  // 要素を作成
  let item = g_data.get_item(id);
  let elem = document.createElement('div');
  elem.id = get_element_id(item.id);
  let text = item.text.replaceAll('\n', '<br>');
  if (item.url !== undefined && item.url !== '') {
    elem.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  } else {
    elem.innerHTML = text;
  }
  elem.dataset.id = item.id;
  elem.tabIndex = 1;
  elem.style.top = top;
  elem.style.left = left;
  elem.style.backgroundColor = item.color;
  elem.classList.add('item');
  if (item.size !== undefined && item.size !== '') {
    elem.classList.add(item.size);
  }
  if (item.is_bold) {
    elem.classList.add('bold');
  }

  // canvas divへ追加
  document.getElementById('canvas').appendChild(elem);

  // 位置調整(配置後に幅が取得できる為、このタイミングで調整する)
  let adjusted_pos = get_adjusted_box_pos(top, left, elem.clientWidth, direction);
  elem.style.top = adjusted_pos.top;
  elem.style.left = adjusted_pos.left;

  // event handler
  elem.addEventListener("keydown", keyhandler_item);
  elem.addEventListener("dblclick", dblclick_handler_item);
  elem.addEventListener("transitionstart", transitionStart_handler);
  elem.addEventListener("transitionend", transitionEnd_handler);

  return elem;
}

/**
 * @summary 線を描く
 * @param 要素1
 * @param 要素2
 * @param 展開方向("right"(default) or "left")
 * @returns オブジェクト
 */
function create_line(elem1, elem2, direction) {
  let startSocket = 'right';
  let endSocket  = 'left';
  if (direction === 'left') {
    startSocket = 'left';
    endSocket = 'right';
  }
  return new LeaderLine(elem1, elem2, {path: 'fluid', startSocket: startSocket, endSocket: endSocket});
}

/**
 * @summary 要素を配置
 * @param ID
 * @param 描画位置(TOP)
 * @param 描画位置(LEFT)
 * @param 要素の幅
 * @param 展開方向('right'(既定) or 'left')
 * @returns 要素位置( {top:n, left:n} )
 */
function get_adjusted_box_pos(top, left, width, direction) {
  if (direction === undefined || direction === 'right') {
    return {top: top, left: left};
  }
  if (direction === 'left') {
    return {top: top, left: left - width};
  }
  return null;
}

/**
 * @summary 編集用テキストボックス作成
 * @param 親要素
 * @param 種類('edit', 'textarea')
 * @param モード('add', 'edit', 'insert')
 * @param 編集対象属性('text', 'url')
 */
function show_edit_box(id, type, mode, target_attr) {
  let elem = null;
  if (type === 'textarea') {
    elem = document.createElement('textarea');
  }
  if (type === 'edit') {
    elem = document.createElement('input');
    elem.type = 'text';
  }
  // 属性
  if (type === 'textarea') {
    elem.cols = edit_cols;
    elem.rows = edit_rows;
  }
  elem.dataset.id = id;
  elem.dataset.mode = mode;
  elem.dataset.attr = target_attr;
  // テキスト
  if (mode === 'edit') {
    if (target_attr === 'text') {
      elem.value = g_data.get_item(id).text;
    }
    if (target_attr === 'url' && g_data.get_item(id).url !== undefined) {
      elem.value = g_data.get_item(id).url;
    }
  } else {
    elem.value = '';
  }

  // 位置
  let rect_parent = document.getElementById(get_element_id(id)).getBoundingClientRect();
  // let rect_parent = elem_parent.getBoundingClientRect();
  elem.style.top = rect_parent.top - 20 + window.scrollY;
  elem.style.left = rect_parent.right;
  elem.style.position = 'absolute';

  // イベントハンドラ(フォーカスロスト)
  // elem.addEventListener("blur", handler_edit_submit);

  // イベントハンドラ(キー)
  elem.addEventListener("keydown", function(event){ 
    // enter
    if (event.keyCode === key_enter) {
      if (!event.shiftKey) {
        event.preventDefault(); // 既定の動作をキャンセル
        handler_edit_submit(event);
      }
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
  let elem = event.target;
  // テキスト取得
  let text = elem.value;
  // モード
  let mode = elem.dataset.mode;
  // 編集対象属性
  let target_attr = elem.dataset.attr;
  // 対象ID
  let id = elem.dataset.id;
  // 要素削除
  elem.remove();

  // 要素追加
  if (text !== '') {
    if (mode === 'add') {
      g_data.add_new_item(id, text);
    }
    if (mode === 'edit') {
      if (target_attr === 'text') {
        g_data.set_text(id, text);
      }
    }
    if (mode === 'insert') {
      g_data.insert_item(id, text);
    }
    draw_item_all();
  }
  if (mode === 'edit') {
    if (target_attr === 'url') {
      g_data.set_url(id, text);
      draw_item_all();
    }
  }

  // フォーカス
  document.getElementById(get_element_id(id)).focus();
}

/**
 * @summary エディットボックス キャンセル
 */
function handler_edit_cancel(event) {
  event.target.value = '';
  event.target.remove();

  // フォーカスを戻す
  let id = event.target.dataset.id;
  document.getElementById(get_element_id(id)).focus();
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

// 初期化
init();
