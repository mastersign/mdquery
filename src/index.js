/* global require, module */

var os = require('os');
var _ = require('lodash');
var mdd = require('mddata');
var textTransformation = require('gulp-text-simple');

var __debug = function (msg) {
	// console.log('# ' + msg);
};

var isText = _.isString;
var isNode = function (x) { return x && isText(x.name); };
var isArray = _.isArray;
var isContainer = function (x) { return x && isArray(x.children); };
var isNodeWithChildren = function (x) { return x && isNode(x) && isContainer(x); };

var formatData = function (data) {
	'use strict';
	if (isText(data)) {
		return 'Text(' + data + ')';
	} else if (isArray(data)) {
		return 'Array (' + _.size(data) + ')';
	} else if (isNodeWithChildren(data)) {
		return 'Node(' + data.name + ', ' + _.size(data) + ')';
	} else if (isNode(data)) {
		return 'Node(' + data.name + ')';
	} else {
		return 'Unknown';
	}
};

var parsePath = function (path) {
	'use strict';
	if (typeof(path) === 'string') {
		return path.split('/');
	} else {
		return path;
	}
};

var buildCriterionRegex = function (pattern) {
	return new RegExp(
		'^' + _.escapeRegExp(pattern).
		replace(/\\\*/g, '.*').replace(/\\\?/g, '.') + '$');
};

var buildCriterion = function (pathPart) {
	'use strict';
	var typTest = function (t) { return true; };
	var separator = pathPart.indexOf(':');
	if (separator > -1) {
		var typ = pathPart.slice(0, separator);
		typTest = function (t) { return typ === '' || t === typ; };
		pathPart = pathPart.slice(separator + 1);
	}

	var regex = buildCriterionRegex(pathPart);
	return function (x) {
		if (isText(x)) {
			return regex.test(x);
		} else if (isNode(x)) {
			return typTest(x.typ) && regex.test(x.name);
		} else {
			return false;
		}
	};
};

var formatResult = function (selection) {
	'use strict';
	if (!selection) {
		return null;
	}
	var path = selection[0];
	var node = selection[1];
	if (isText(node)) {
		return { name: node, path: path };
	} else if (isNode(node)) {
		var result = _.omit(node, 'children');
		result.path = path;
		return result;
	} else {
		return null;
	}
};

var extendResultList = function (resultList, additionals) {
	'use strict';
	function arraysEqual(a, b) {
		if (a === b) { return true; }
		if (a === null || b === null) {	return false; }
		if (a.length !== b.length) { return false; }
		for (var i = 0; i < a.length; ++i) {
			if (a[i] !== b[i]) { return false; }
		}
		return true;
	}
	_.forEach(additionals, function (x) {
		if (_.every(resultList, function (y) {
			return !arraysEqual(x.path, y.path);
		})) {
			resultList.push(x);
		}
	});
};

var resolvePath = function (coll, path) {
	'use strict';
	if (_.size(path) === 0) {
		return null;
	}
	var n = { children: coll };
	_.forEach(path, function (i) {
		n = n.children[i];
	});
	if (isText(n)) {
		n = { name: n };
	}
	return n;
};

var globPath = function globPath(coll, queryPath, absolute, path, result) {
	'use strict';
	if (isNodeWithChildren(coll)) {
		coll = coll.children;
	}
	if (!isArray(coll)) {
		__debug('GLOB ERROR Invalid input: ' + coll);
		return null;
	}
	__debug('GLOB ' + formatData(coll));
	__debug('GLOB Path (absolute=' + absolute + '): ' + queryPath);
	if (queryPath[0] === '**') {
		return globPath(coll, _.drop(queryPath), false, path, result);
	}
	path = path || [];
	result = result || [];
	var criterion = buildCriterion(queryPath[0]);
	var selections = [];
	_.forEach(coll, function (n, i) {
		if (criterion(n)) {
			__debug('GLOB Select ' + i + ': ' + formatData(n));
			selections.push([path.concat([i]), n]);
		}
	});
	if (_.size(queryPath) === 1) {
		extendResultList(result, _.map(selections, formatResult));
	} else if (_.size(queryPath) > 1) {
		_.forEach(selections, function (s) {
			var p = s[0];
			var e = s[1];
			if (e.children) {
				result = globPath(e.children, _.drop(queryPath),
					true, p, result);
			}
		});
	}
	if (!absolute) {
		_.forEach(coll, function (n, i) {
			if (isNodeWithChildren(n)) {
				result = globPath(n.children, queryPath, false,
					path.concat([i]), result);
			}
		});
	}
	return result;
};

var findNodes = function (coll, selector) {
	'use strict';
	var queryPath = parsePath(selector);
	if (queryPath.size === 0) {
		return null;
	}
	var absolute = queryPath[0] === '';
	if (absolute) {
		queryPath = _.drop(queryPath, 1);
	}
	return globPath(coll, queryPath, absolute);
};

var firstMatchingChild = function (node, criterion) {
	'use strict';
	var nodesWithIndex = _.map(
		node.children,
		function (n, i) { return [i, n]; });
	var matchingNodesWithIndex = _.filter(
		nodesWithIndex,
		function (r) { return criterion(r[1]); });
	return _.first(matchingNodesWithIndex);
};

var findRelativeNode = function (coll, refPath, selector) {
	'use strict';
	var queryPath = parsePath(selector);
	refPath = _.clone(refPath);
	var n = resolvePath(coll, refPath);
	__debug('FIND RELATIVE ROOT ' + formatData(n));
	_.forEach(queryPath, function (q) {
		__debug('FIND RELATIVE POS ' + refPath + ': ' + q);
		if (q === '' || q === '.') {
			__debug('FIND RELATIVE skip');
			return;
		} else if (q === '..') {
			__debug('FIND RELATIVE parent');
			refPath = _.dropRight(refPath);
			n = resolvePath(coll, refPath);
		} else {
			var r = firstMatchingChild(n, buildCriterion(q));
			if (r) {
				__debug('FIND RELATIVE children: ' + q + ' -> ' + r[1].name);
				n = r[1];
				refPath.push(r[0]);
			} else {
				__debug('FIND RELATIVE children: ' + q + ' NOT FOUND');
			}
		}
	});
	return n;
};

var nodeAttribute = function (node, attribute) {
	'use strict';
	if (!node) {
		return null;
	}
	if (attribute === 'name') {
		return node.name;
	} else if (attribute === 'value') {
		return node.value;
	} else {
		return 'unknown attribute: ' + attribute;
	}
};

var nodePredicate = function (data, andFilters) {
	return function (node) {
		return _.every(andFilters, function (orFilters) {
			return _.some(orFilters, function (filter) {
				var testNode = findRelativeNode(data, node.path, filter.selector);
				var testValue = nodeAttribute(testNode, filter.attribute);
				var regex = buildCriterionRegex(filter.pattern);
				return regex.test(testValue);
			});
		});
	};
};

var nodeSortCriterion = function (data, sortBy) {
	return function (node) {
		var testNode = findRelativeNode(data, node.path, sortBy.selector);
		return nodeAttribute(testNode, sortBy.attribute);
	};
};

var cellFromNode = function (node, attribute) {
	'use strict';
	if (!node) {
		return null;
	}
	if (attribute === 'name') {
		var cell = { text: node.name };
		if (node.anchor) {
			cell.href = '#' + node.anchor;
		}
		return cell;
	}
	if (attribute === 'value') {
		return { text: node.value ? node.value : null };
	}
	return { text: 'unknown attribute: ' + attribute };
};

var table = function (data, query) {
	'use strict';
	var nodes = findNodes(data, query.selector);
	if (isArray(query.filters)) {
		nodes = _.filter(nodes, nodePredicate(data,query.filters));
	}
	if (isArray(query.sortBys)) {
		nodes = _.orderBy(nodes,
			_.map(query.sortBys, function (sortBy) {
				return nodeSortCriterion(data, sortBy);
			}),
			_.map(query.sortBys, function (sortBy) {
				 return sortBy.direction ? sortBy.direction : 'asc';
			}));
	}
	if (isArray(query.columns) && _.some(query.columns)) {
		return {
			columns: _.map(query.columns, function (col) {
				return { text: col.name };
			}),
			rows: _.map(nodes, function (node) {
				return _.map(query.columns, function (col) {
					var cellNode = findRelativeNode(
						data, node.path, col.selector);
					return cellFromNode(cellNode, col.attribute);
				});
			})
		};
	} else {
		if (_.every(nodes, function (n) { return n.value === undefined; })) {
			return {
				columns: [{ text: 'Name' }],
				rows: _.map(nodes, function (n) {
					var cell = { text: n.name };
					if (n.anchor) {
						cell.href = '#' + n.anchor;
					}
					return [cell];
				})
			};
		} else {
			return {
				columns: [
					{ text: 'Name' },
					{ text: 'Value' }
				],
				rows: _.map(nodes, function (n) {
					var nameCell = { text: n.name };
					if (n.anchor) {
						nameCell.href = '#' + n.anchor;
					}
					var valueCell = { text: n.value ? n.value : null };
					return [nameCell, valueCell];
				})
			};
		}
	}
};

var formatMarkdownCell = function (cell) {
	'use strict';
	if (!cell) {
		return '';
	}
	if (cell.href) {
		return '[' + cell.text + '](' + cell.href + ')';
	}
	return cell.text;
};

var formatMarkdownList = function (table) {
	'use strict';
	var md = '';
	var rowCnt = _.size(table.rows);
	if (_.size(table.columns) === 1) {
		_.forEach(table.rows, function (row, i) {
			md += '* ' + formatMarkdownCell(row[0]);
			if (i < rowCnt - 1) {
				md += os.EOL;
			}
		});
	} else if (_.size(table.columns) > 1) {
		_.forEach(table.rows, function (row, i) {
			md += '* ' + formatMarkdownCell(row[0]);
			var value = formatMarkdownCell(row[1]);
			if (value) {
				md += ': ' + value;
			}
			if (i < rowCnt - 1) {
				md += os.EOL;
			}
		});
	}
	return md;
};

var formatMarkdownTable = function (table) {
	'use strict';
	var md = '| ' +
		_.map(table.columns,
			function (column) {
				return column.text;
			})
			.join(' | ') + ' |' + os.EOL;
	md += '|' +
		_.map(table.columns,
			function (column) {
				return _.repeat('-', _.size(column.text) + 2);
			})
			.join('|') + '|' + os.EOL;
	var rowCnt = _.size(table.rows);
	_.forEach(table.rows, function (cells, i) {
		md += '| ' +
			_.map(cells, formatMarkdownCell)
				.join(' | ') + ' |';
		if (i < rowCnt - 1) {
			md += os.EOL;
		}
	});
	return md;
};

var transformText = function (text) {
	'use strict';
	var parseDefinitions = function (spec) {
		var lines = _.map(spec.split('\n'),
			function (l) { return _.trim(l); });

		// Parse Columns
		var colRegex = /^#column\s+([^:]+?)\s*:\s+([^\s\(]+)\((.*?)\)$/;
		var columns = _
			.chain(lines)
			.map(function (l) {
				var m = colRegex.exec(l);
				if (m) {
					return { name: m[1], attribute: m[2], selector: m[3] };
				} else {
					return null;
				}
			})
			.filter()
			.value();

		// Parse Filters
		var parseFilter = function (expr) {
			var filterRegex = /^([^\s\(]+)\((.*?)\)\s*:\s+([^\n]*?)$/;
			var parts = _.chain(expr.split('|'))
				.map(function (s) { return s.trim(); })
				.map(function (s) {
					filterRegex.lastIndex = 0;
					var m = filterRegex.exec(s);
					if (m) {
						return { attribute: m[1], selector: m[2], pattern: m[3] };
					} else {
						return null;
					}
				})
				.filter()
				.value();
			return _.isEmpty(parts) ? null : parts;
		};

		var filterRegex = /^#filter\s+(.*?)\s*$/;
		var filters = _
			.chain(lines)
			.map(function (l) {
				var m = filterRegex.exec(l);
				if (m) {
					return parseFilter(m[1]);
				} else {
					return null;
				}
			})
			.filter()
			.value();

		// Parse Sort-Bys
		var sortByRegex = /^#sort-by\s+([^\s\(]+)\((.*?)\)\s*(?::\s+([^\n]*?)\s*)?$/;
		var sortBys = _
			.chain(lines)
			.map(function (l) {
				var m = sortByRegex.exec(l);
				if (m) {
					return { attribute: m[1], selector: m[2], direction: m[3] };
				} else {
					return null;
				}
			})
			.filter()
			.value();

		return {
			columns: columns,
			filters: filters,
			sortBys: sortBys
		};
	};
	var data = mdd(text);
	text = text.replace(
		/<!--\s+#data-list\s+([^\n]*?)\s+-->/gm,
		function (m, s) {
			return formatMarkdownList(table(data, { selector: s }));
		});
	text = text.replace(
		/<!--\s+#data-table\s+([^\n]*?)\s+-->/gm,
		function (m, s) {
			return formatMarkdownTable(table(data, { selector: s }));
		});
	text = text.replace(
		/<!--\s+#data-table\s+([^\n]*?)\s*\n\s*([\s\S]*?)\s+-->/gm,
		function (m, s, d) {
			var defs = parseDefinitions(d);
			var query = _.assign(defs, { selector: s });
			return formatMarkdownTable(table(data, query));
		});
	text = text.replace(
		/<!--\s+#data-list\s+([^\n]*?)\s*\n\s*([\s\S]*?)\s+-->/gm,
		function (m, s, d) {
			var defs = parseDefinitions(d);
			var query = _.assign(defs, { selector: s });
			return formatMarkdownList(table(data, query));
		});
	return text;
};

module.exports = {
	select: findNodes,
	query: table,
	formatMarkdownTable: formatMarkdownTable,
	formatMarkdownList: formatMarkdownList,
	transform: textTransformation(transformText),
};
