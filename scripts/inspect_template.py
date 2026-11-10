from pptx import Presentation

prs = Presentation(r'c:\Users\MAHESH\Downloads\CA-3  TEMPLATE_MINI PROJECT CSE2271 (1).pptx')
print(f'Total slides: {len(prs.slides)}')
print(f'Slide dimensions: {prs.slide_width / 914400:.2f} inches x {prs.slide_height / 914400:.2f} inches')

for idx, slide in enumerate(prs.slides, 1):
    print(f'\n--- Slide {idx} ---')
    for shape in slide.shapes:
        if shape.has_text_frame:
            texts = [p.text.strip() for p in shape.text_frame.paragraphs if p.text.strip()]
            if texts:
                print(f'  [Text Shape at ({shape.left/914400:.1f}, {shape.top/914400:.1f})]:', ' // '.join(texts))
        elif shape.has_table:
            print(f'  [Table {len(shape.table.rows)}x{len(shape.table.columns)} at ({shape.left/914400:.1f}, {shape.top/914400:.1f})]')
            for r in shape.table.rows:
                row_txt = [c.text.strip().replace('\n', ' ') for c in r.cells]
                print('    | ' + ' | '.join(row_txt) + ' |')
        elif shape.shape_type == 13:
            print(f'  [Picture at ({shape.left/914400:.1f}, {shape.top/914400:.1f}) {shape.width/914400:.1f}x{shape.height/914400:.1f}]')

