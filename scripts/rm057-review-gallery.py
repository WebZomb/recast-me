"""Build an offline owner review from supplier-returned JPEGs only."""
from pathlib import Path
import base64, html, json

root = Path(__file__).resolve().parents[1]
proofs = root / 'rm057-showcase'
report = json.loads((proofs / 'report.json').read_text())
out = Path('/workspace/scratch/d0223de85889/Recast-Product-Image-Review.html')
hero_views = {'Hoodie': 1, 'T-Shirt': 1, 'Hardcover Journal': 1, 'Tumbler': 1}
def esc(value): return html.escape(str(value))
def image(path, alt):
    data = base64.b64encode(path.read_bytes()).decode()
    return f'<img loading="lazy" src="data:image/jpeg;base64,{data}" alt="{esc(alt)}">'

cards = []
for index, item in enumerate(report['examples'].values(), 1):
    product, files = item['product'], item['files']
    chosen = hero_views.get(product, 0)
    primary = files[chosen]
    design = item['design']
    layout = design.get('layout', '')
    fill = design.get('fill', design.get('background', ''))
    caption = ' · '.join(filter(None, [layout.replace('-', ' '), fill.replace('-', ' '), design.get('orientation')]))
    size = item.get('variantLabel') or item['variantIdentity']['name']
    note = ''
    if product in ['Coaster 4-Pack','Magnet 3-Pack']:
        note = '<p class="note">Supplier view shows one item. The purchased set contains matching copies.</p>'
    elif product in ['Hardcover Journal','Pillow','Blanket']:
        note = '<p class="note">The background bands shown here are part of this fitted layout. They preserve the complete subject.</p>'
    elif product in ['Hoodie','T-Shirt']:
        note = '<p class="note">Front print shown at the supplier’s actual placement and scale, with soft edges. Back is blank.</p>'
    extra = ''.join('<figure>'+image(proofs/f['file'], product+' — '+f['title'])+'<figcaption>'+esc(f['title'])+'</figcaption></figure>' for n,f in enumerate(files) if n != chosen)
    details = f'<details><summary>Other supplier views ({len(files)-1})</summary><div class="views">{extra}</div></details>' if extra else ''
    cards.append(f'<article id="item-{index}"><div class="picture">{image(proofs/primary["file"],product+" — "+item["scene"])}</div><div class="copy"><p class="eyebrow">{index:02} / {esc(item["scene"])}</p><h2>{esc(product)}</h2><p class="size">{esc(size)}</p><p>{esc(caption)}</p>{note}{details}</div></article>')

document = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recast Me — product image review</title><style>
*{box-sizing:border-box}body{margin:0;background:#090813;color:#f5f2fc;font-family:system-ui,sans-serif;line-height:1.55}header,main,footer{max-width:1240px;margin:auto;padding:32px 24px}header{padding-top:58px}.eyebrow{font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:#94dfec;font-weight:700}h1{font-size:clamp(36px,6vw,66px);line-height:1.08;letter-spacing:-.045em;margin:18px 0}header>p{max-width:820px;color:#bdb7ce;font-size:18px}.status{display:inline-block;border:1px solid #7661a8;border-radius:22px;padding:8px 16px;color:#dfd3ff;background:#241b3c;font-size:13px}.intro{border:1px solid #413251;border-radius:18px;padding:20px 24px;background:#151023;max-width:920px}.intro p{margin:8px 0;color:#c3bed0}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px}article{align-self:start;border:1px solid #40324f;border-radius:22px;overflow:hidden;background:#13101f}.picture{background:white}img{display:block;width:100%;height:auto}.copy{padding:24px}h2{font-size:27px;line-height:1.15;margin:12px 0}.size{font-size:19px;color:white!important;font-weight:650}.copy>p{color:#beb7ca}.copy .eyebrow{color:#94dfec}.note{font-size:14px;border-left:2px solid #9b6fe0;padding-left:14px}summary{cursor:pointer;padding:14px 0;color:#99dfef;font-weight:600}.views{display:grid;gap:16px}figure{margin:0;background:#21182d;border-radius:12px;overflow:hidden}figcaption{padding:9px 14px;font-size:13px}footer{color:#bdb7ce;padding-bottom:60px}footer strong{color:#eae5f7}@media(max-width:680px){main{grid-template-columns:1fr;padding:20px 16px}header,footer{padding-left:20px;padding-right:20px}.copy{padding:20px}}@media print{body{background:white;color:#111}article{break-inside:avoid;background:white}.copy>p{color:#333}header>p{color:#333}details{display:none}}
</style><header><p class="eyebrow">RECAST ME AI · OWNER REVIEW · OCTOBER 7, 2026</p><h1>Real layouts.<br>More worlds to show.</h1><span class="status">Review candidates — not published</span><p>Different subjects and adventures, placed on the exact supplier products. Choose the examples you like before we replace the website and Shopify images.</p><div class="intro"><p><strong>These are Printful-generated mockups.</strong> Product shape, print position, crop and borders come from the selected supplier variant. They are not AI-invented product photos or physical samples.</p><p>Each size below is the pictured variant. Other sizes require their own preview. Colors, seams and placement can vary slightly in production.</p><p>Preview watermarks and the bottom preview strip do <strong>not</strong> print. Demo scenes illustrate the adventures; customer likeness and AI results vary.</p></div></header><main>'''+''.join(cards)+'''</main><footer><p><strong>How to review:</strong> Tell me which product examples to keep or change. For a change, name the product and the subject/adventure you prefer.</p><p>Keep the previously accepted cutout sticker; no replacement sticker or new sticker pack is proposed here. The HD file and digital pack stay digital products. They do not need a manufactured-product mockup. Gifts can use the recipient’s shipping address and the buyer’s email/billing details.</p></footer></html>'''
out.write_text(document)
print(json.dumps({'path':str(out),'products':len(report['examples']),'bytes':out.stat().st_size,'failures':report['failures']}))
