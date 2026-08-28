# にゅうた 説明資料ビューア (nyuta-explainer)

患者さん（飼い主様）向けの説明資料PDFを、iPadでタップして選び、紙芝居のように見せる／自分で読んでもらうためのアプリ。

## 構成

- React + Vite + Tailwind CSS v4
- Firebase Firestore（メタデータ）+ Firebase Storage（PDF・サムネイル本体）
- pdf.js（PDF表示・サムネイル生成）
- @dnd-kit（編集モードでのドラッグ&ドロップ並び替え）
- vite-plugin-pwa（ホーム画面追加・キャッシュ高速化）

閲覧は誰でもオープン。追加・編集・並び替えは、編集モード（6桁PINで開く）に入っているときだけ操作できる。書き込みは院内共通アカウントでの自動サインインにひもづけて保護している。

## ① Firebaseプロジェクトの準備（ブラウザでの一度きりの作業）

1. https://console.firebase.google.com/ を開き、いつも使っているアカウント（Blazeプラン）で新規プロジェクトを作成する。
2. 左メニュー「Firestore Database」→ データベースを作成（本番モード、リージョンは他のクリニックアプリと同じものを選ぶと良い）。
3. 左メニュー「Storage」→ 開始する（デフォルト設定でOK）。
4. 左メニュー「Authentication」→ Sign-in method で「メール/パスワード」を有効化 → Users タブで院内共通アカウント（例: `staff@nyuta-ahp.com` のような、実在しなくてもよい専用メールアドレス＋任意のパスワード）を1つ作成する。これが `.env` の `VITE_SHARED_ACCOUNT_EMAIL` / `VITE_SHARED_ACCOUNT_PASSWORD` になる。
5. Firestore の「ルール」タブに、このリポジトリの `firestore.rules` の内容を貼り付けて公開する。
6. Storage の「ルール」タブに、このリポジトリの `storage.rules` の内容を貼り付けて公開する。
7. 「プロジェクトの設定」→「全般」→ 一番下の「マイアプリ」でウェブアプリを追加し、表示される設定値（apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId）を控える。

## ② Firestoreの初期データ（カテゴリ）を登録する

Firestore の「データ」タブから、`categories` コレクションを作成し、以下の2件のドキュメントを追加する（ドキュメントIDは自動採番でよい）。

| name | order | icon |
| --- | --- | --- |
| インフォーム資料 | 0 | 🩺 |
| 飼い主様資料 | 1 | 🏠 |

将来「マニュアル」等のカテゴリを追加したくなったら、同じ要領でドキュメントを1件追加するだけでよい（コードの変更は不要）。

## ③ 環境変数を設定する

`.env.example` を `.env` にコピーし、①②で控えた値を入力する。`VITE_EDIT_PIN` には編集モード用の6桁の数字を設定する。

```
cp .env.example .env
```

## ④ 開発・ビルド

```
npm install
npm run dev      # ローカルで確認
npm run build    # 本番ビルド（dist/ に出力）
```

## ⑤ iPadでの運用メモ

- 各iPadでSafariからアプリを開き、共有ボタン→「ホーム画面に追加」しておくと、アドレスバーのない専用アプリのような見た目で使える。
- 飼い主様に端末を渡すときは、渡す前に本体側面（またはホーム）ボタンを3回押して「アクセスガイド」を開始する。終了時は同じ操作＋設定したパスコード（6桁）で解除する。設定は「設定 > アクセシビリティ > アクセスガイド」から行う。
- Wi-Fiが安定している前提でオンライン動作。一度開いた資料はキャッシュされるため、2回目以降は高速に開く。
