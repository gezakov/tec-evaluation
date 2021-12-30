import difflib
#help(difflib)
import json

output = []
with open("selected_segment_idxs.txt") as f:
    lines = f.readlines()
    selected_idxs = set([int(l) for l in lines])

for filebase in ['test']:
  srclines = open(filebase + '.src').readlines()
  tgtlines = open(filebase + '.confirmed_tgt').readlines()
  teclines = open(filebase + '.tec').readlines()
  for i, (src,tgt,tec) in enumerate(zip(srclines, tgtlines, teclines)):
    if i not in selected_idxs:
        continue
    idx = 0
    from_text = []
    to_text = []
    diff_blocks = []
    diff_block_start_idx = None
    in_diff_block = False
    for diffitem in difflib.ndiff(tgt.split(' '), tec.split(' ')):
      start = diffitem[0:2]
      rest = diffitem[2:]
      if start == '? ':
        continue
      if in_diff_block:
        if start == '- ':
          from_text.append(rest)
          idx += len(rest) + 1
        elif start == '+ ':
          to_text.append(rest)
        elif start == '  ':
          #diff_blocks.append([idx, len(' '.join(from_text)), tgt[diff_block_start_idx:diff_block_start_idx + len(' '.join(from_text))], ' '.join(from_text), ' '.join(to_text)])
          # special case for insertion since our diffing is token-based: insert a space after the newly inserted token
          if len(from_text) == 0: 
            to_text.append("")

          diff_blocks.append([diff_block_start_idx, len(' '.join(from_text)), ' '.join(to_text)])
          in_diff_block = False
          diff_block_start_idx = None
          from_text = []
          to_text = []
          idx += len(rest) + 1
      else:
        if start == '- ':
          from_text.append(rest)
          in_diff_block = True
          diff_block_start_idx = idx
          idx += len(rest) + 1
        elif start == '+ ':
          to_text.append(rest)
          in_diff_block = True
          diff_block_start_idx = idx
        elif start == '  ':
          idx += len(rest) + 1

    if len(from_text) > 0 or len(to_text) > 0:
      # special case for insertion since our diffing is token-based: insert a space after the newly inserted token
      if len(from_text) == 0: 
        to_text.append("")

      #diff_blocks.append([idx, len(' '.join(from_text)), tgt[diff_block_start_idx:diff_block_start_idx + len(' '.join(from_text))], ' '.join(from_text), ' '.join(to_text)])
      diff_blocks.append([diff_block_start_idx, len(' '.join(from_text)), ' '.join(to_text)])
      in_diff_block = False
      diff_block_start_idx = None
      from_text = []
      to_text = []
    output_item = {
      'src': src,
      'tgt': tgt,
      'edits': diff_blocks,
    }
    if "GUIDANCE LINE" in tgt:
      import pdb; pdb.set_trace()

    #for x in diff_blocks:
    #  if x[2] != x[3]:
    #    print(output_item)
    output.append(output_item)
open('../dataset.js', 'wt').write('var dataset = ' + json.dumps(output, ensure_ascii=False) + ';')
