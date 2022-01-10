import os
import requests
import json
import time

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

def get_seg_info_from_events(events):
    e = events[0]
    if e["evt"] != "set_idx":
        e = events[1]
    assert e["evt"] == "set_idx"
    src = e["src"].strip()
    tgt = e["tgt"].strip()
    cond = e["cond"]
    idx = e["idx"]

    e = events[-1]
    assert e["evt"] == "done"
    final = e["final_text"].strip()

    return idx, src, tgt, cond, final

def process_user_study_data(user_study_data, survey_data):
    """
    survey_data: {
        src: ...
        confirmed_tgt: ...
        reviewed_tgt: ... <-
        trans: [{
            email: ...
            cond: ...
            final_text: ...
        }]
    }
    """
    for email, data in user_study_data.items():
        assert len(survey_data) == len(data)
        for seg_data in data:
            idx, src, original_tgt, cond, final = get_seg_info_from_events(seg_data["dataDecoded"])
            if survey_data[src]["src"] != src:
                import pdb; pdb.set_trace()
            assert survey_data[src]["confirmed_tgt"] == original_tgt

            if final not in survey_data[src]["unique_trans"]:
                survey_data[src]["unique_trans"].append(final)

            unique_trans_idx = survey_data[src]["unique_trans"].index(final)

            survey_data[src]["all_user_trans"].append({
                "email": email,
                "cond": cond,
                "final_text": final,
                "unique_trans_idx": unique_trans_idx,
                })

            assert len(set(survey_data[src]["unique_trans"])) == len(survey_data[src]["unique_trans"])

    return survey_data

def write_survey_to_plaintext(survey_data, f):
    # Iterate in original idx order
    srcs_and_idxs = [(src, data["original_idx"]) for src, data in survey_data.items()]
    srcs_and_idxs = sorted(srcs_and_idxs, key=lambda x: x[1])
    print(srcs_and_idxs)

    for i, (src, _) in enumerate(srcs_and_idxs):
        ques_data = survey_data[src]
        f.write(f"{i+1}. Source: {src}\n")
        f.write(f"Translations:\n")
        for trans_idx, trans in enumerate(ques_data["unique_trans"]):
            f.write(f" [{LETTERS[trans_idx]}] {trans}\n")
        f.write("\n\n")

## Get ground truth data
src = open("tec-data/test.src").readlines()
confirmed_tgt = open("tec-data/test.confirmed_tgt").readlines()
tgt = open("tec-data/test.tgt").readlines()
selected_idxs = [int(x) for x in open("tec-data/selected_segment_idxs.txt").readlines()]

survey_data = {}
combined = list(zip(src, confirmed_tgt, tgt))
for original_idx in selected_idxs:
    src, confirmed, tgt = combined[original_idx]
    src = src.strip()
    confirmed = confirmed.strip()
    tgt = tgt.strip()
    # assumes unique source
    survey_data[src] = {
        "original_idx": original_idx,
        "src": src,
        "confirmed_tgt": confirmed,
        "reviewed_tgt": tgt,
        "all_user_trans": [],
        "unique_trans": [confirmed, tgt] if confirmed != tgt else [tgt]
        }

with open("output.json") as f:
    user_study_data = json.load(f)

survey_data = process_user_study_data(user_study_data, survey_data)

for k, v in survey_data.items():
    assert len(v["all_user_trans"]) == 9

with open("survey_data.json", "w") as f:
    json.dump(survey_data, f)

# Write to plaintext
with open("survey.txt", "w") as f:
    write_survey_to_plaintext(survey_data, f)


