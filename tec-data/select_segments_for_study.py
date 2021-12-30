
edited_by_tec = set()
edited_by_gt = set()

with open("test.confirmed_tgt") as confirmed_tgt, open("test.tec") as tec:
    for i, (ct, t) in enumerate(zip(confirmed_tgt, tec)):
        if ct != t:
            edited_by_tec.add(i)

with open("test.confirmed_tgt") as confirmed_tgt, open("test.tgt") as tgt:
    for i, (ct, t) in enumerate(zip(confirmed_tgt, tgt)):
        if ct != t:
            edited_by_gt.add(i)

print("TEC edited: ", len(edited_by_tec))
print("GT edited: ", len(edited_by_gt))
both_edited = edited_by_tec.intersection(edited_by_gt)
print(" intersection: ", len(both_edited))

gt_edited_only = edited_by_gt - both_edited
# Select all TEC edited segments + N ground truth edited segments
selected_segs = sorted(list(edited_by_tec) + list(gt_edited_only)[:len(edited_by_tec) - len(both_edited)])
assert len(selected_segs) == len(set(selected_segs))
print(selected_segs)
with open("selected_segment_idxs.txt", "w") as f:
    f.write("\n".join([str(x) for x in selected_segs]))
