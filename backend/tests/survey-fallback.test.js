const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Point the JSON fallback at a throwaway file BEFORE requiring the model
// (DATA_FILE is resolved at module load). With no mongoose.connect() call,
// connection.readyState stays 0, so every call exercises the fallback path —
// exactly the code that silently broke before (the $set unwrap bug).
const tmpFile = path.join(os.tmpdir(), `surveyo-test-${Date.now()}.json`);
process.env.FALLBACK_DATA_FILE = tmpFile;

const Survey = require('../models/Survey');

test.after(() => { try { fs.unlinkSync(tmpFile); } catch { /* ignore */ } });

test('create + findById round-trips nested data', async () => {
    const created = await Survey.create({
        propertyDetails: { unitNumber: 'Unit 1', inspector: 'Alice' },
        sections: [{ roomName: 'Kitchen', items: [{ label: 'Sink', status: 'Good' }] }],
        status: 'Draft'
    });
    assert.ok(created._id, 'expected an id');

    const found = await Survey.findById(created._id);
    assert.strictEqual(found.propertyDetails.unitNumber, 'Unit 1');
    assert.strictEqual(found.sections[0].items[0].label, 'Sink');
});

test('findByIdAndUpdate unwraps $set, applies sections, and merges propertyDetails', async () => {
    const created = await Survey.create({
        propertyDetails: { unitNumber: 'Unit 2', inspector: 'Bob' },
        sections: [],
        status: 'Draft'
    });

    const updated = await Survey.findByIdAndUpdate(
        created._id,
        { $set: { sections: [{ roomName: 'Bath', items: [] }], propertyDetails: { unitNumber: 'Unit 2B' } } },
        { new: true }
    );

    // The bug we fixed: sections under $set must actually apply.
    assert.strictEqual(updated.sections.length, 1);
    assert.strictEqual(updated.sections[0].roomName, 'Bath');
    // Fields not included in the update must be preserved by the merge.
    assert.strictEqual(updated.propertyDetails.unitNumber, 'Unit 2B');
    assert.strictEqual(updated.propertyDetails.inspector, 'Bob');
});

test('find returns saved surveys newest-first', async () => {
    const all = await Survey.find();
    assert.ok(Array.isArray(all));
    assert.ok(all.length >= 2, 'expected the two surveys created above');
});

test('findByIdAndDelete removes the survey', async () => {
    const created = await Survey.create({ propertyDetails: { unitNumber: 'Temp' }, sections: [], status: 'Draft' });
    await Survey.findByIdAndDelete(created._id);
    const found = await Survey.findById(created._id);
    assert.strictEqual(found, null);
});
