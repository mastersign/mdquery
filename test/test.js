/* global require, Buffer, describe, it, beforeEach */

var fs = require('fs');
var os = require('os');
var File = require('vinyl');
var assert = require('assert');
var mdq = require('../src/index');

var dataPath = './test/data/data.json';

describe('mddata', function () {
	'use strict';

	describe('selectors', function () {

		var data = null;

		beforeEach(function () {
			data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
		});

		it('/Section 1 -> [Section 1]', function () {
			var result = mdq.select(data, '/Section 1');
			var expected = [
				{
					"name": "Section 1",
					"typ": "headline",
					"id": "s_1",
					"anchor": "s_1",
					"path": [0]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('/:Section 1 -> [Section 1]', function () {
			var result = mdq.select(data, '/:Section 1');
			var expected = [
				{
					"name": "Section 1",
					"typ": "headline",
					"id": "s_1",
					"anchor": "s_1",
					"path": [0]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('/headline:Section 1 -> [Section 1]', function () {
			var result = mdq.select(data, '/headline:Section 1');
			var expected = [
				{
					"name": "Section 1",
					"typ": "headline",
					"id": "s_1",
					"anchor": "s_1",
					"path": [0]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('/ulist:Section 1 -> []', function () {
			var result = mdq.select(data, '/ulist:Section 1');
			var expected = [];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('/* -> [Section 1, Section 2]', function () {
			var result = mdq.select(data, '/*');
			var expected = [
				{
					"name": "Section 1",
					"typ": "headline",
					"id": "s_1",
					"anchor": "s_1",
					"path": [0]
				},
				{
					"name": "Section 2",
					"typ": "headline",
					"anchor": "section-2",
					"path": [1]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('/Section 1/List -> List', function () {
			var result = mdq.select(data, '/Section 1/List');
			var expected = [
				{
					"name": "List",
					"typ": "ulist",
					"path": [0, 0]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('/Section 1/List/* -> [Entry A, Entry B]', function () {
			var result = mdq.select(data, '/Section 1/List/*');
			var expected = [
				{
					"name": "Entry A",
					"typ": "ulist",
					"path": [0, 0, 0]
				},
				{
					"name": "Entry B",
					"typ": "ulist",
					"path": [0, 0, 1]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('/Section 2/**/*Point* -> [First Point, Second Point, Third Point, Point 2.1, Point 2.2]', function () {
			var result = mdq.select(data, '/Section 2/**/*Point*');
			var expected = [
				{
					"name": "First Point",
					"typ": "olist",
					"path": [1, 0]
				},
				{
					"name": "Second Point",
					"typ": "olist",
					"value": "123",
					"path": [1, 1]
				},
				{
					"name": "Third Point",
					"typ": "olist",
					"path": [1, 2]
				},
				{
					"name": "Point 2.1",
					"typ": "olist",
					"path": [1, 1, 0]
				},
				{
					"name": "Point 2.2",
					"typ": "olist",
					"value": "456",
					"path": [1, 1, 1]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('List -> [List]', function () {
			var result = mdq.select(data, 'List');
			var expected = [
				{
					"name": "List",
					"typ": "ulist",
					"path": [0, 0]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('List/* -> [Entry A, Entry B]', function () {
			var result = mdq.select(data, 'List/*');
			var expected = [
				{
					"name": "Entry A",
					"typ": "ulist",
					"path": [0, 0, 0]
				},
				{
					"name": "Entry B",
					"typ": "ulist",
					"path": [0, 0, 1]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('list/* -> [a, b]', function () {
			var result = mdq.select(data, 'list/*');
			var expected = [
				{
					"name": "a",
					"typ": "ulist",
					"path": [0, 3, 2, 0, 0]
				},
				{
					"name": "b",
					"typ": "ulist",
					"path": [0, 3, 2, 0, 1]
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});

		it('list/a/* -> [x, y]', function () {
			var result = mdq.select(data, 'list/a/*');
			var expected = [
				{
					"name": "x",
					"typ": "ulist",
					"path": [0, 3, 2, 0, 0, 0],
					"value": "3"
				},
				{
					"name": "y",
					"typ": "ulist",
					"path": [0, 3, 2, 0, 0, 1],
					"value": "4"
				}
			];
			assert.deepEqual(result, expected, 'selected nodes do not match expected nodes');
		});
	});

	describe('tables', function () {

		var data = null;

		beforeEach(function () {
			data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
		});

		it('/Section * -> cols=[Name], rows=1', function () {
			var result = mdq.query(data, {
				selector: '/Section *'
			});
			var expected = {
				columns: [{ text: 'Name' }],
				rows: [
					[{ text: 'Section 1', href: '#s_1' }],
					[{ text: 'Section 2', href: '#section-2'}]
				]
			};
			assert.deepEqual(result, expected, 'result does not match expected table');
		});

		it('/Section 1/Property */* -> cols=[Name, Value], rows=4', function () {
			var result = mdq.query(data, {
				selector: '/Section 1/Property */*'
			});
			var expected = {
				columns: [{ text: 'Name' }, { text: 'Value' }],
				rows: [
					[{ text: 'Subproperty X.1' }, { text: 'X1' }],
					[{ text: 'Subproperty X.2' }, { text: 'X2' }],
					[{ text: 'Subproperty Y.1' }, { text: 'Y1' }],
					[{ text: 'Subproperty Y.2' }, { text: 'Y2' }]
				]
			};
			assert.deepEqual(result, expected, 'result does not match expected table');
		});

		it('/Section 1/Property * (nAME, vALUE) -> rows=2', function () {
			var result = mdq.query(data, {
				selector: '/Section 1/Property *',
				columns: [
					{ name: 'nAME',	selector: '.', attribute: 'name' },
					{ name: 'vALUE', selector: '.',	attribute: 'value'}
				]
			});
			var expected = {
				columns: [{ text: 'nAME' }, { text: 'vALUE' }],
				rows: [
					[{ text: 'Property X' }, { text: '`Value`' }],
					[{ text: 'Property Y' }, { text: null }]
				]
			};
			assert.deepEqual(result, expected, 'result does not match expected table');
		});

		it('list/* (List, X, Y) -> rows=2', function () {
			var result = mdq.query(data, {
				selector: 'list/*',
				columns: [
					{ name: 'List', selector: '', attribute: 'name' },
					{ name: 'X', selector: 'x', attribute: 'value' },
					{ name: 'Y', selector: './y', attribute: 'value' }
				]
			});
			var expected = {
				columns: [{ text: 'List' }, { text: 'X' }, { text: 'Y' }],
				rows: [
					[{ text: 'a' }, { text: '3' }, { text: '4' }],
					[{ text: 'b' }, { text: '5' }, { text: '6' }],
				]
			};
			assert.deepEqual(result, expected, 'result does not match expected table');
		});

		it('list/*/x (Chapter, List, X, Y) -> rows=2', function () {
			var result = mdq.query(data, {
				selector: 'list/*/x',
				columns: [
					{ name: 'Chapter', selector: '../../..', attribute: 'name' },
					{ name: 'List', selector: '..', attribute: 'name' },
					{ name: 'X', selector: '.', attribute: 'value' },
					{ name: 'Y', selector: '../y', attribute: 'value' }
				]
			});
			var expected = {
				columns: [{ text: 'Chapter' }, { text: 'List' }, { text: 'X' }, { text: 'Y' }],
				rows: [
					[{ text: 'Paragraph 1.1.1', href: '#p_1-1-1' }, { text: 'a' }, { text: '3' }, { text: '4' }],
					[{ text: 'Paragraph 1.1.1', href: '#p_1-1-1' }, { text: 'b' }, { text: '5' }, { text: '6' }],
				]
			};
			assert.deepEqual(result, expected, 'result does not match expected table');
		});

		it('Property X -> cols=[Name], rows=1', function () {
			var result = mdq.query(data, {
				selector: 'Property X',
				columns: [{ name: 'Name', selector: '..', attribute: 'name' }]
			});
			var expected = {
				columns: [{ text: 'Name' }],
				rows: [
					[{ text: 'Section 1', href: '#s_1' }]
				]
			};
			assert.deepEqual(result, expected, 'result does not match expected table');
		});

	});

	describe('Markdown format', function () {
		it('list with one column', function () {
			var table = {
				columns: [{ text: 'Column 1' }],
				rows: [
					[{ text: 'ABC' }],
					[{ text: 'DEF', href: '#def' }]
				]
			};
			var result = mdq.formatMarkdownList(table);
			var expected =
				"* ABC" + os.EOL +
				"* [DEF](#def)";
			assert.equal(result, expected);
		});

		it('list with two columns', function () {
			var table = {
				columns: [{ text: 'Column 1' }, { text: 'Column 2' }],
				rows: [
					[{ text: 'ABC' }, { text: '123' }],
					[{ text: 'DEF', href: '#def' }, { text: '`abc<>def`' }]
				]
			};
			var result = mdq.formatMarkdownList(table);
			var expected =
				"* ABC: 123" + os.EOL +
				"* [DEF](#def): `abc<>def`";
			assert.equal(result, expected);
		});

		it('table with two columns', function () {
			var table = {
				columns: [{ text: 'Column 1' }, { text: 'Column **2**' }],
				rows: [
					[{ text: 'ABC' }, { text: '123' }],
					[{ text: 'DEF', href: '#def' }, { text: '`abc<>def`' }]
				]
			};
			var result = mdq.formatMarkdownTable(table);
			var expected =
				"| Column 1 | Column **2** |" + os.EOL +
				"|----------|--------------|" + os.EOL +
				"| ABC | 123 |" + os.EOL +
				"| [DEF](#def) | `abc<>def` |";
			assert.equal(result, expected);
		});
	});

	describe('Markdown transformation', function () {

		describe('as a function', function () {

			it('simple list transformation', function () {
				var source = fs.readFileSync('./test/data/data-list-simple.md', 'utf-8');
				var expected = fs.readFileSync('./test/data/data-list-simple.expected.md', 'utf-8');
				var result = mdq.transform(source);
				assert.equal(result, expected, 'Markdown text does meet the expectation');
			});

			it('simple table transformation', function () {
				var source = fs.readFileSync('./test/data/data-table-simple.md', 'utf-8');
				var expected = fs.readFileSync('./test/data/data-table-simple.expected.md', 'utf-8');
				var result = mdq.transform(source);
				assert.equal(result, expected, 'Markdown text does meet the expectation');
			});

			it('complex list transformation', function () {
				var source = fs.readFileSync('./test/data/data-list-complex.md', 'utf-8');
				var expected = fs.readFileSync('./test/data/data-list-complex.expected.md', 'utf-8');
				var result = mdq.transform(source);
				assert.equal(result, expected, 'Markdown text does meet the expectation');
			});

			it('complex table transformation', function () {
				var source = fs.readFileSync('./test/data/data-table-complex.md', 'utf-8');
				var expected = fs.readFileSync('./test/data/data-table-complex.expected.md', 'utf-8');
				var result = mdq.transform(source);
				assert.equal(result, expected, 'Markdown text does meet the expectation');
			});

		});

		describe('as a Gulp transformation', function () {

			it('should transform the vinyl file object', function (done) {
				var fakeFile = new File({
					contents: new Buffer(fs.readFileSync('./test/data/data-table-complex.md'))
				});
				var expected = fs.readFileSync('./test/data/data-table-complex.expected.md', 'utf-8');

				var stream = mdq.transform();
				stream.write(fakeFile);
				stream.once('data', function (file) {
					var result = file.contents.toString('utf-8');
					assert.equal(result, expected, 'transformed file does not match expected file');
					done();
				});
			});

		});

	});

});
