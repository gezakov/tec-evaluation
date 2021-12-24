import difflib
#help(difflib)
import json

output = []
for filebase in ['test517099', 'test517100']:
  srclines = open(filebase + '.src').readlines()
  tgtlines = open(filebase + '.confirmed_tgt').readlines()
  teclines = open(filebase + '.new_tec').readlines()
  for src,tgt,tec in zip(srclines, tgtlines, teclines):
    if tgt == tec:
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
    #for x in diff_blocks:
    #  if x[2] != x[3]:
    #    print(output_item)
    output.append(output_item)
open('../dataset.js', 'wt').write('var dataset = ' + json.dumps(output, ensure_ascii=False) + ';')