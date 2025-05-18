//---------------------------------------
// Global
//---------------------------------------



//---------------------------------------
// Class (Data)
//---------------------------------------

class DataManager {

  // 内部データ
  g_list_data = {
    "0": {id: 0, text: "root", parent: -1, children: [], color: ''}, 
  };

  // 初期データ
  g_list_data_init = {
    "0": {id: 0, text: "root", parent: -1, children: [], color: ''}, 
  };

  // 最新ID
  g_last_id = 1;


  /**
   * コンストラクタ
   */
  constructor() {}

  /**
   * @summary 指定IDの要素を取得
   * @param ID
   */
  get_item(id) {
    return this.g_list_data[id];
  }

  /**
   * @summary 要素の数を取得
   * @returns 要素の数
   */
  get_item_num() {
    return Object.keys(this.g_list_data).length;
  }

  /**
   * @summary 要素追加
   * @param 要素
   */
  add_item(item) {
    this.record_history();
    this.g_list_data[item.id] = item;
  }

  /**
   * @summary 新しい要素を追加
   * @param 親要素ID
   * @param テキスト
   */
  add_new_item(parent_id, text) {
    this.record_history();

    let id = this.genItemID();
    let item = this.make_item(id, parent_id, text, null);
    this.add_item(item);
    this.g_list_data[parent_id].children.push(id);
  }

  /**
   * @summary 要素を挿入
   * @param 親要素ID
   * @param テキスト
   */
  insert_item(parent_id, text) {
    this.record_history();

    // 要素を追加
    let id = this.genItemID();
    let item_parent = this.get_item(parent_id);
    let item = this.make_item(id, parent_id, text, item_parent.children);
    this.add_item(item);

    // 子要素の親を追加要素に変更
    for (let i = 0; i < item_parent.children.length; i++) {
      this.set_parent(item_parent.children[i], id);
    }

    // 親要素の子要素を追加要素のみにする
    this.set_children(parent_id, [id]);
  }

  /**
   * @summary 要素を作成
   * @param ID
   * @param 親要素ID
   * @param テキスト
   * @param 子要素
   */
  make_item(id, parent_id, text, children) {
    let children_copy = [];
    if (children !== null) {
      children_copy= children.concat();
    }
    return { 
      id: id, 
      text: text, 
      color: "", 
      size: "",
      parent: parent_id, 
      children: children_copy};
  }

  /**
   * @summary テキスト設定
   * @param ID
   * @param テキスト
   */
  set_text(id, text) {
    this.record_history();

    let item = this.get_item(id);
    item.text = text;
  }

  /**
   * @summary 色設定
   * @param ID
   * @param 色(ex '#FFFFFF') (nullは色なし)
   */
  set_color(id, color) {
    this.record_history();
    let item = this.get_item(id);
    if (color === null) {
      item.color = '';
    } else {
      item.color = color;
    }
  }

  /**
   * @summary 太字設定(トグル)
   * @param ID
   */
  toggle_bold(id) {
    this.record_history();
    let now = this.get_item(id).is_bold;
    if (now === undefined) {
      now = false;
    }
    this.get_item(id).is_bold = !now;
  }

  /**
   * @summary サイズ設定
   * @param サイズ('', 'middle, 'big')
   */
  set_size(id, size) {
    let item = this.get_item(id);
    if (size === null) {
      item.size = '';
    } else {
      item.size = size;
    }
  }

  /**
   * @summary 方向設定
   * @param 方向('right' or 'left')
   */
  set_direction(id, direction) {
    let item = this.get_item(id);
    if (direction === 'right') {
      delete item.direction;
    } else {
      item.direction = direction;
    }
  }

  /**
   * @summary 方向設定
   * @param 方向('right' or 'left')
   * @param true:rootまで遡って検査する / false:指定IDのみ
   */
  get_direction(id, check_root) {
    let item = this.get_item(id);
    if (check_root) {
      if (item.parent != 0) {
        return this.get_direction(item.parent, true);
      } else {
        return item.direction;
      }
    }
    return item.direction;
  }

  /**
   * @summary URL設定
   * @param ID
   * @param URL
   */
  set_url(id, url) {
    this.record_history();
    this.get_item(id).url = url;
  }

  /**
   * @summary 親要素設定
   * @param ID
   * @param 親ID
   */
  set_parent(id, parent_id) {
    this.record_history();
    this.get_item(id).parent = parent_id;
  }

  /**
   * @summary 子要素設定 (上書き)
   * @param 親ID
   * @param 子ID
   */
  set_children(id, children) {
    this.record_history();
    let children_new = [];
    if (children !== null) {
      children_new = children.concat();
    }
    this.get_item(id).children = children_new;
  }

  /**
   * @summary 子要素追加(複数)
   * @param 親ID
   * @param 子ID(配列)
   */
  add_children(id, children_target) {
    this.record_history();
    let children = this.get_item(id).children;
    for (let i = 0; i < children_target.length; i++) {
      children.push(children_target[i]);
    }
  }

  /**
   * @summary 子要素削除(ID指定)
   * @param 親ID
   * @param 子ID
   */
  remove_children_id(id, child_id) {
    this.record_history();
    let children = this.get_item(id).children;
    for (let i = 0; i < children.length; i++) {
      if (children[i] == child_id) {
        children.splice(i, 1);
        break;
      }
    }
  }
  
  /**
   * 全てのLineを削除
   */
  remove_all_line() {
    let keys = Object.keys(this.g_list_data);
    for (let i = 0; i <  keys.length; i++) {
      let item = this.g_list_data[keys[i]];
      if (item.line !== undefined) {
        item.line.remove();
        delete item.line;
      }
    }
  }

  /**
   * @summary 要素削除 (子要素は親に付け替える)
   * @param ID
   */
  remove_item(id) {
    this.record_history();
    // 子要素の親を削除要素の親に変更
    let item = this.get_item(id);
    for (let i = 0; i < item.children.length; i++) {
      this.set_parent(item.children[i], item.parent);
    }

    // 親要素から削除要素を削除
    this.remove_children_id(item.parent, id);

    // 親要素の子要素を削除要素の子へ追加する
    this.add_children(item.parent, item.children);

    // 要素divを削除
    remove_item_div(id);

    // 自身を削除
    delete this.g_list_data[id];
  }

  /**
   * @summary 要素削除 (子要素も削除)
   * @param ID
   * @param (通常は指定しない)
   */
  remove_item_ex(id, is_nest) {
    if (is_nest === undefined) {
      this.record_history();
    }

    let item = this.get_item(id);
    let parent_id = item.parent;

    // 子要素を削除
    for (let i = 0; i < item.children.length; i++) {
      this.remove_item_ex(item.children[i], true);
    }

    // 要素divを削除
    remove_item_div(id);

    // 自身を削除
    delete this.g_list_data[id];

    // 親要素の子要素から指定IDを削除 (再起終了後)
    if (is_nest === undefined) {
      let item_parent = this.get_item(parent_id);
      for (let i = 0; i < item_parent.children.length; i++) {
        if (item_parent.children[i] == id) {
          item_parent.children.splice(i,1);
        }
      }
    }
  }

  /**
   * @summary 子要素の中の順番変更
   * @param ID
   * @param true:前へ移動 / false:後ろへ移動
   */
  change_order_children(id, is_up) {
    this.record_history();

    // 子要素の中から指定IDを探す
    let res = this.find_in_childlen(id);
    if (res === null) {
      return;
    }

    if (is_up && res.pos !== 0) {
      [res.children[res.pos], res.children[res.pos-1]] = [res.children[res.pos-1], res.children[res.pos]]
    }
    if (!is_up && res.pos !== res.children.length - 1) {
      [res.children[res.pos], res.children[res.pos+1]] = [res.children[res.pos+1], res.children[res.pos]]
    }
  }

  /**
   * 要素を付け替え
   * @param {*} 対象ID 
   * @param {*} 親ID
   */
  chage_parent(id, parent) {
    this.record_history();

    // 元の親要素の子要素から削除
    let info = this.find_in_childlen(id);
    if (info === null) {
      return;
    }
    info.children.splice(info.pos, 1);

    // 親を付け替え
    this.get_item(id).parent = parent;

    // 親要素の子要素へ追加
    this.get_item(parent).children.push(id);
  }

  /** 
   * @summary 同一子配列中の隣のID取得
   * @param true:前のID / false:後ろのID
   * @returns ID
   */
  get_neighbor_id(id, prev) {
    let res = this.find_in_childlen(id);
    if (res === null) {
      return null;
    }

    let ret = null;
    if (prev && res.pos > 0) {
      ret = res.children[res.pos - 1];
    }
    if (!prev && res.pos < res.children.length - 1) {
      ret = res.children[res.pos + 1];
    }
    return ret;
  }

  /**
   * @summary 子要素の中から指定IDを検索し、子要素配列と要素位置を返す
   * @param ID
   * @returns {children: 指定IDが含まれる子要素の配列, pos: 要素位置}
   */
  find_in_childlen(id) {
    let parent_id = this.get_item(id).parent;
    let children = this.get_item(parent_id).children;
    for (let i = 0; i < children.length; i++) {
      if (children[i] == id) {
        return {children: children, pos: i};
      }
    }
    return null;
  }

  /**
   * @summary 新しいアイテムIDを発行する
   * @returns ID
   */
  genItemID() {
    let new_id = this.g_last_id;
    this.g_last_id++;
    return new_id;
  }

  /**
   * @summary 最後のIDを計算
   */
  update_last_id() {
    let last_id = 0;
    let keys = Object.keys(this.g_list_data);
    for (let i = 0; i < keys.length; i++) {
      let id = parseInt(keys[i]);
      if (last_id < id) {
        last_id = id;
      }
    }
    this.g_last_id = last_id + 1;
  }

  /**
   * @summary JSONをインポート
   * @param JSON文字列
   */
  import_json(json_str) {
    this.record_history();

    let json_obj = JSON.parse(json_str);
    if (json_obj !== null) {
      this.g_list_data = json_obj;
      this.update_last_id(); // 最後のIDを計算
    }
  }

  /**
   * @summary JSONをインポート
   * @param JSONオブジェクト
   */
  import_json_ex(json_obj) {
    this.record_history();

    if (json_obj !== null) {
      this.g_list_data = json_obj;
      this.update_last_id(); // 最後のIDを計算
    }
  }

  /**
   * @summary Undo
   */
  undo() {
    let json_obj = popHistory();
    if (json_obj === null) {
      return;
    }
    this.g_list_data = json_obj;
  }

  /**
   * @summary 内部データのJSON文字列を取得
   * @param JSON文字列
   */
  get_json_string() {
    let json_str = JSON.stringify(this.g_list_data, null , "  ");
      // 一度dictを復元し、lineを削除
      let temp_dict = JSON.parse(json_str);
      let keys = Object.keys(temp_dict);
      for (let i = 0; i < keys.length; i++) {
        delete temp_dict[keys[i]].line;
      }
    return JSON.stringify(temp_dict, null , "  ");
  }

  /**
   * @summary 指定IDの配下要素のJSON文字列取得
   * @param {Int} ID
   * @param {boolean} 指定IDをルート(ID:0)として切り出す
   * @returns JSON文字列
   */
  get_sub_items_json(id, as_root) {
    // 配下要素のIDリストを取得
    let ids = this.get_children_ids(id);
    // 各要素のJSONを集める
    let dict = {};
    for(let i = 0; i < ids.length; i++) {
      dict[ids[i]] = JSON.parse(JSON.stringify(this.get_item(ids[i])));
    }
    // 指定ID要素をルートとする
    if (as_root) {
      dict['0'] = dict[id];
      dict['0'].id = 0;
      dict['0'].parent = -1;
      delete dict[id];
      let keys = Object.keys(dict);
      for (let i = 0; i < keys.length; i++) {
        if (dict[keys[i]].parent == id) {
          dict[keys[i]].parent = 0;
        }
      }
    }
    return JSON.stringify(dict);
  }

  /**
   * @summary 子要素のID一覧を取得
   * @param {} id 
   * @returns 子要素リスト(配列)
   */
  get_children_ids(id, dest) {
    if (dest === undefined) {
      dest = [];
    }
    dest.push(id);

    let item = this.get_item(id);
    for (let i = 0; i < item.children.length; i++) {
      this.get_children_ids(item.children[i], dest);
    }
    return dest;
  }

  /**
   * @summary キャンバスのサイズを取得 (実装中)
   * @returns {h: [横の要素数], w: [縦の要素数]}
   */
  get_canvas_size() {
  }

  calc_canvas_size(id, base_top, base_left) {
    let item = this.get_item(id);
    let top_sub = base_top;
    let top_last = base_top;
    for (let i = 0; i < item.children.length; i++) {
      top_last = this.calc_canvas_size(item.children[i], top_sub, base_left + 1);
      top_sub = top_last + 1;
    }
  
    return top_last;
  }

  /**
   * @summary 現在の状態を編集履歴へ記録
   */
  record_history() {
    pushHistory(this.get_json_string());
  }

  /**
   * @summary 内部データ保存
   * @param スロットID
   */
  save_json(slot) {
    // JSON文字列取得
    let json_str = this.get_json_string();
    // 保存
    saveStorage(this.get_storage_key(slot), json_str);
  }

  /**
   * @summary 内部データ読み込み
   * @param スロットID
   */
  load_json(slot) {
    this.record_history();
    let data = loadStorage(this.get_storage_key(slot));
    this.import_json(data);
  }

  /**
   * @summary storageへアクセスするキー取得
   * @param スロットID
   * @returns storage保存用キー
   */
  get_storage_key(slot) {
    return key_internal_data + '_' + slot;
  }

  /**
   * @summary 内部データを配列化したデータを取得
   * @param ID
   * @param ID格納先配列(2次元配列)
   * @param 配列位置(縦)
   * @param 配列位置(横)
   * @returns 最後の縦位置
   */
  get_array(id, dest, pos_vertical, pos_depth) {
    console.log(id, pos_vertical, pos_depth);

    let item = this.get_item(id);
    dest[pos_vertical][pos_depth] = item.id;

    for (let i = 0; i < item.children.length; i++) {
      pos_vertical = this.get_array(item.children[i], dest, pos_vertical, pos_depth + 1);
      pos_vertical++;
    }
    if (item.children.length > 0) {
      pos_vertical--;
    }

    return pos_vertical;
  }

  /**
   * @summary 内部データを配列に変換
   * @returns 配列
   */
  exchange_internal_to_array() {
    let dest = [];
    let dest_sub = [];

    // 配列初期化 (100 x 200)
    // 横
    for (let i = 0; i < 100; i++) {
      dest_sub.push('');
    }
    // 縦
    for (let i = 0; i < 200; i++) {
      dest.push(dest_sub.concat());
    }

    this.get_array(0, dest, 0, 0);
    return dest;
  }

  /**
   * @summary HTMLテーブルを作成
   * @returns HTMLテーブル
   */
  get_html_table() {
    let array = this.exchange_internal_to_array();
    let html = '';

    html += '<table>';
    html += '<tbody>';
    html += '\n';
    for (let i = 0; i < array.length; i++) {
      let array_td = [];
      html += '<tr>';
      html += '\n';
      for (let k = 0; k < array[i].length; k++) {
        // 横方向
        if (array[i][k] === '') {
          let td = `<td></td>`;
          array_td.push(td);
          continue;
        }
        let item = this.get_item(array[i][k]);
        let style = '';
        if (item.color !== '') {
          style = `style="color: ${item.color};"`;
        }
        let td = `<td ${style} >${item.text}</td>`;
        array_td.push(td);
      }
      html += array_td.join('');
      html += '</tr>';
      html += '\n';
    }
    html += '</tbody>';
    html += '</table>';

    return html;
  }

}
