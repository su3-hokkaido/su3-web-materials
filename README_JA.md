[English](./README.md)

# su3-web-materials

実際に動作する Web Components(Lit 3 + TypeScript、Shadow DOM、CSS カスタムプロパティのデザイントークン)
のカタログです。Storybook で公開し、product ごとに Cloudflare Workers Static Assets へデプロイし、npm
に公開します。再利用を前提にしており、UI コンポーネントカタログのないチームに参加した外部委託メンバーや
新入社員が、フォークして名前を変えるだけで、テーマ変更可能でテスト済み、ドキュメント付きのカタログを
その日のうちに用意できます。

公開カタログ: `https://<your-worker>.workers.dev/`(自分でデプロイしたもののアドレス。
[他のチームでこのリポジトリを再利用する](#他のチームでこのリポジトリを再利用する)を参照)。

コンポーネント: `su3-button`、`su3-icon-button`、`su3-checkbox`、`su3-switch`、`su3-text-field`、
`su3-divider`。フォームコントロールは form-associated(`ElementInternals`)で、ネイティブのコントロールと
同じように送信、検証、リセット、復元ができます。

## 技術スタック

- Lit 3 と TypeScript(デコレータなし)、Shadow DOM、CSS カスタムプロパティによるデザイントークン
  (`--su3-ref-*`、`--su3-sys-*`、`--su3-comp-*`)
- Storybook(`@storybook/web-components-vite`)。ドキュメントは `custom-elements.json` から生成
- Vitest Browser Mode(実 Chromium)と、Docker 上の Playwright によるビジュアルリグレッションテスト
- tsdown(バンドルしない ESM パッケージ)、publint と attw によるチェック、Changesets
- pnpm、Docker、Make、GitHub Actions、Cloudflare Workers Static Assets(無料プラン)

## クイックスタート

Docker が標準の実行環境です。

```sh
make setup   # copies the .env samples, builds the image, installs dependencies
make dev     # Storybook at http://localhost:5070
make ci      # the same checks as CI
```

Docker を使わない場合は、Node.js(`.nvmrc` を参照)と pnpm をインストールし、
`pnpm exec playwright install chromium` を一度実行してから `local-*` ターゲット(`make local-install`、
`make local-dev`、`make local-ci`)を使います。

## プロジェクト構成

```text
src/shared/components/{category}/{name}/   # components shared by every product
src/shared/behaviors/                      # base classes (form association)
src/shared/styles/                         # state layer, focus ring, touch target
src/shared/tokens/                         # design tokens (ref, sys, comp helpers)
src/products/{productId}/                  # a themed product: index.ts and theme.css
deploy/                                    # Cloudflare and local nginx configuration
tests/                                     # visual regression tests and consumer fixtures
docs/                                      # specification (project_plan.md) and per-task docs
```

- **productId** はカタログのテーマ違いの版です(`sample` と `acme` が含まれます)。product ごとに専用の
  Storybook をビルドし、共通コンポーネントはすべてのビルドに含まれます。
- カタログの URL: `/{productId}/` が Storybook、`/{productId}/c/{category}/{component}` がコンポーネントへの
  直接リンクです(例: `/sample/c/buttons/button`)。`/` のポータルに product の一覧が表示されます。
- ストーリーの title は `{Category}/{Component}`(productId なし)で、すべてのストーリーファイルは
  `Default` ストーリーを export します。短縮 URL が `--default` を指すためです。

各コンポーネントのディレクトリには `{name}.ts`、`{name}.styles.ts`、`{name}.stories.ts`、
`{name}.test.ts`、`index.ts` が入ります。仕様の全体は `docs/project_plan.md` にあります。

## パッケージの使い方

```sh
npm install su3-web-materials
```

パッケージは ESM のみです。コンポーネントのエントリを import するとその要素が登録され、`all.js` を
import するとすべてが登録されます。パッケージのルート(`su3-web-materials`)はクラスと型だけを提供し、
何も登録しません。

### プレーン HTML、Vite、その他のバンドラ

```ts
import 'su3-web-materials/tokens.css';
import 'su3-web-materials/button.js';
import type { ButtonVariant } from 'su3-web-materials';

// `document.createElement('su3-button')` is typed as Su3Button.
const button = document.createElement('su3-button');
const variant: ButtonVariant = 'filled';
button.variant = variant;
button.textContent = 'Save';
document.body.append(button);
```

マークアップでは要素をそのまま書きます。

```html
<su3-button variant="filled">Save</su3-button>
```

`tokens.css` は必須ではありません。コンポーネントは組み込みの既定値を持つため、読み込まなくてもテーマなしの
見た目で動作します。

### React 19

カスタム要素は JSX で使えます。TypeScript に要素の props を一度だけ教えます。

```tsx
import 'su3-web-materials/tokens.css';
import 'su3-web-materials/button.js';
import type { ButtonSize, ButtonVariant, FormSubmitterType, Su3Button } from 'su3-web-materials';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type Su3ButtonProps = DetailedHTMLProps<HTMLAttributes<Su3Button>, Su3Button> & {
  variant?: ButtonVariant;
  type?: FormSubmitterType;
  size?: ButtonSize;
  disabled?: boolean;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'su3-button': Su3ButtonProps;
    }
  }
}

export const Save = () => (
  <su3-button variant="filled" type="button" onClick={() => console.log('saved')}>
    Save
  </su3-button>
);
```

### Vue 3

Vue のコンパイラに、`su3-*` タグがカスタム要素であることを伝えます(`vite.config.ts`)。

```ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue({
      template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('su3-') } },
    }),
  ],
});
```

```ts
import 'su3-web-materials/tokens.css';
import 'su3-web-materials/all.js';
```

これらのスニペットは `tests/consumers` のフィクスチャに対応しています。`make check-consumers` が、パックした
tarball からインストールして Chromium でテストします。

### トークンとテーマ

先に `tokens.css` を、その後にテーマを読み込みます。見た目はすべてトークンの上書きで作ります。

```ts
import 'su3-web-materials/tokens.css';
import 'su3-web-materials/themes/acme.css';
```

テーマは `--su3-sys-*` と `--su3-comp-*` のカスタムプロパティだけを上書きします(例:
`--su3-sys-color-accent`、`--su3-comp-button-container-shape`)。ダークモードは `prefers-color-scheme` に
従うか、祖先要素に `data-theme="light"` または `data-theme="dark"` を指定します。トークン、デザイン言語、
アクセシビリティの方針は、カタログの Foundation ページに書かれています。

## 他のチームでこのリポジトリを再利用する

1. フォークまたはテンプレートとして使い、パッケージ名(`package.json` の `name`、`repository`、
   `homepage`、`bugs`)とドキュメント内のリポジトリ URL を変更します。MIT の `LICENSE` は残し、著作権者を
   更新します。
2. `make new-product PRODUCT_ID=yourteam` で自分たちの版を追加します(`src/products/yourteam/index.ts` と
   `theme.css` を作成し、パッケージの `exports` を同期します)。`theme.css` でトークンを上書きします。
   コントラストはテストで検証されます。
3. コンポーネントは `/new-component` スキルで追加するか、既存のコンポーネントディレクトリをコピーします。
   `CLAUDE.md` とそのチェックリストに従ってください。
4. ホスティングは Cloudflare Workers Static Assets の無料プランです。Worker 名はリポジトリ変数
   `CLOUDFLARE_WORKER_NAME` から決まります。別の場所にデプロイするには、
   `.github/workflows/_deploy.yml` と `deploy/cloudflare/` を置き換えます。ビルド成果物は
   `dist/storybook` の静的ファイルです。`make preview` は同じ URL 書き換えでローカル配信します。

### 初回セットアップ(リポジトリのオーナー)

1. **GitHub**: `develop` を既定ブランチにします。Settings > Actions > General で GitHub Actions による
   プルリクエストの作成と承認を許可します(または任意のシークレット `RELEASE_TOKEN` を設定します)。
   Dependabot のバージョン更新を有効にします。
2. **Environments**: `development` と `production` を作成します(`production` は保護します)。
3. **Cloudflare**: 「Edit Cloudflare Workers」テンプレートから API トークンを作成し、シークレット
   `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID`、リポジトリ変数 `CLOUDFLARE_WORKER_NAME` を追加します。
   アカウントに `workers.dev` サブドメインが必要です。変数が未設定ならデプロイジョブはスキップされるため、
   フォークでも CI は通ります。
4. **npm**: 下記のリリースフローを参照してください。
5. **ブランチ保護**: `main` と `develop` で `Checks`、`Visual regression test`、`Consumer check` を必須にし、
   マージ前にプルリクエストを要求します。

## リリースフロー

作業は `develop` から切った `feature/...` ブランチで行い、プルリクエストでマージします。`develop` への push
はプレビュー用 Worker(`<name>-dev`)を、`main` への push は本番をデプロイします。どちらも CI の成功後です。

公開パッケージに影響する変更では `make changeset` を実行し、生成されたファイルをコミットします。マージ後、
リリースワークフローが「Version Packages」プルリクエストを作成します。それをマージするとタグ `vX.Y.Z` が
付き、GitHub Release が作られ、Trusted Publishing(保存されたトークンなし)で npm に公開され、`main` から
`develop` へのバックマージのプルリクエストが作成されます。

**初回の公開は手動です。** trusted publisher は、すでに存在するパッケージにしか設定できないためです。

```sh
pnpm run build && pnpm run check:package
npm publish --access public    # from a clean checkout of main, once
```

その後、自分のリポジトリと `release.yml` というワークフローファイル名で trusted publisher を追加し、
リポジトリ変数 `NPM_PUBLISH_REPOSITORY` に `owner/repo` を設定します。設定するまで、リリースワークフローは
公開を試みません。

## Make コマンド

全一覧は `make help` で確認できます。各ターゲットにはホスト用の `local-*` もあります。

| Command                | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `make setup`           | `.env` のサンプルをコピーし、イメージをビルドし、依存関係をインストール |
| `make dev`             | Storybook 開発サーバー(http://localhost:5070)                           |
| `make preview`         | すべての product をビルドし、本番と同じ形で配信(:5071)                  |
| `make ci`              | 解析、整形チェック、lint、型、テスト、パッケージ、Storybook             |
| `make test`            | ブラウザテストと規約テスト(カバレッジ付き)                              |
| `make format`          | Prettier で整形                                                         |
| `make vrt`             | Playwright イメージでビジュアルリグレッションテスト                     |
| `make vrt-update`      | ベースラインを更新(変更された画像を必ず目視)                            |
| `make build`           | npm パッケージを `dist` にビルド                                        |
| `make check-package`   | exports、副作用、マニフェスト、publint、attw を確認                     |
| `make check-consumers` | パックしたパッケージをフィクスチャに入れて確認(ネットワーク必要)        |
| `make sync-exports`    | コンポーネントから `package.json` の `exports` を再生成                 |
| `make new-product`     | `src/products/PRODUCT_ID` を作成(`PRODUCT_ID` が必要)                   |
| `make changeset`       | 公開される変更の changeset を追加                                       |

## ライセンス

MIT。[LICENSE](./LICENSE) を参照してください。サードパーティの通知は
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) にあります。フォントやアイコンは同梱しておらず、
material-web からは何もコピーしていません(構造の着想を得ただけです)。
