/**
 * Tree-sitter grammar for goi design files (.goi).
 *
 * The language is markup, not a script: elements hold properties, values are
 * literals or small expressions, and behaviour lives in Go. Newlines are not
 * tokens, so a member is a property when its identifier is followed by `:` and
 * a child element when it is followed by `{`.
 */
module.exports = grammar({
  name: 'goi',

  extras: $ => [/\s/, $.comment],

  word: $ => $.identifier,

  rules: {
    source_file: $ => seq(
      repeat(choice(
        $.import_statement,
        $.props_block,
        $.bridge_block,
        $.data_shape,
      )),
      field('root', $.element),
    ),

    // bridge { loading: bool, tickets: [ticket], onOpen: func(id: string) }
    // `data { ... }` is the original spelling and parses alike.
    bridge_block: $ => seq(
      choice('bridge', 'data'),
      '{',
      repeat(seq($.data_field, optional(','))),
      '}',
    ),

    // type ticket { title: string }
    // `data ticket { ... }` is the original spelling.
    data_shape: $ => seq(
      choice('type', 'data'),
      field('name', $.identifier),
      '{',
      repeat(seq($.data_field, optional(','))),
      '}',
    ),

    data_field: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.data_type),
      // `count: number = 0` is the value before Go sets one.
      optional(seq('=', field('default', $.value))),
      optional(';'),
    ),

    // bool, string, number, color, [ticket], ticket[], func(id: string)
    data_type: $ => choice(
      $.func_type,
      seq(field('element', $.identifier), optional(seq('[', ']'))),
      seq('[', field('element', $.identifier), ']'),
    ),

    // func(id: string, count: number)
    func_type: $ => seq(
      'func',
      '(',
      optional(seq(
        $.func_parameter,
        repeat(seq(',', $.func_parameter)),
        optional(','),
      )),
      ')',
    ),

    func_parameter: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.identifier),
    ),

    // import "./Sidebar.goi" as Sidebar
    import_statement: $ => seq(
      'import',
      field('path', $.string),
      'as',
      field('alias', $.identifier),
      optional(';'),
    ),

    // props { title: string = "untitled", count: number }
    // The typed values a fragment expects; the body reads props.name.
    props_block: $ => seq(
      'props',
      '{',
      repeat(seq($.prop_field, optional(','))),
      '}',
    ),

    prop_field: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.data_type),
      optional(seq('=', field('default', $.value))),
    ),

    // Column { ... }
    element: $ => seq(
      field('name', $.element_name),
      '{',
      repeat($._member),
      '}',
    ),

    _member: $ => choice(
      $.property,
      $.element,
      $.if_block,
      $.each_block,
      $.slot,
    ),

    // {#if cond} … {:else if cond} … {:else} … {/if}
    if_block: $ => seq(
      '{#if',
      field('condition', $.value),
      '}',
      repeat($._member),
      repeat(seq(
        '{:else',
        'if',
        field('condition', $.value),
        '}',
        repeat($._member),
      )),
      optional(seq(
        '{:else',
        '}',
        repeat($._member),
      )),
      '{/if}',
    ),

    // {#each data.rows as row} … {:else} … {/each}
    each_block: $ => seq(
      '{#each',
      field('list', $.reference),
      'as',
      field('item', $.identifier),
      '}',
      repeat($._member),
      optional(seq(
        '{:else',
        '}',
        repeat($._member),
      )),
      '{/each}',
    ),

    // $children — where an instance's children go. A named slot such as
    // `$actions { ... }` is the same marker with a body.
    slot: $ => seq(
      '$',
      field('name', $.identifier),
      optional(seq('{', repeat($._member), '}')),
    ),

    // spacing: 8
    property: $ => seq(
      field('name', $.identifier),
      ':',
      field('value', $.value),
      optional(';'),
    ),

    element_name: _ => /[A-Z][A-Za-z0-9_]*/,

    // Values are one expression grammar, so `text: hello` and
    // `width: side.width / 2` are both plain values.
    // A value is an expression; the conditional is optional, which is what
    // makes `text: hello` a plain value and `a ? b : c` a conditional.
    value: $ => prec.right(seq(
      field('condition', $.or_expression),
      optional(seq(
        alias('?', $.conditional_question),
        field('then', $.value),
        alias(':', $.conditional_colon),
        field('else', $.value),
      )),
    )),

    or_expression: $ => prec.left(seq(
      $.and_expression,
      repeat(seq('||', $.and_expression)),
    )),

    and_expression: $ => prec.left(seq(
      $.equality_expression,
      repeat(seq('&&', $.equality_expression)),
    )),

    equality_expression: $ => prec.left(seq(
      $.comparison_expression,
      repeat(seq(choice('==', '!='), $.comparison_expression)),
    )),

    comparison_expression: $ => prec.left(seq(
      $.sum_expression,
      repeat(seq(choice('<', '<=', '>', '>='), $.sum_expression)),
    )),

    sum_expression: $ => prec.left(seq(
      $.term_expression,
      repeat(seq(choice('+', '-'), $.term_expression)),
    )),

    term_expression: $ => prec.left(seq(
      $.unary_expression,
      repeat(seq(choice('*', '/'), $.unary_expression)),
    )),

    unary_expression: $ => choice(
      prec(2, seq(choice('!', '-'), $.unary_expression)),
      $.primary,
    ),

    primary: $ => choice(
      $.string,
      $.template_string,
      $.percentage,
      $.number,
      $.boolean,
      $.color,
      $.handler_call,
      $.reference,
      $.identifier,
      $.map,
      $.parenthesized_expression,
    ),

    parenthesized_expression: $ => seq('(', $.value, ')'),

    // 50%
    percentage: $ => seq($.number, alias('%', $.percent_sign)),

    // bridge.onOpen(post.id), the value of an event property.
    handler_call: $ => seq(
      field('function', $.reference),
      '(',
      optional(seq(
        $.value,
        repeat(seq(',', $.value)),
        optional(','),
      )),
      ')',
    ),

    // side.width, app.dark, window.width, props.title
    reference: $ => prec(1, seq(
      field('object', $.identifier),
      '.',
      field('member', $.identifier),
    )),

    // { base: 16, md: 24 }
    map: $ => seq(
      '{',
      optional(seq(
        $.map_entry,
        repeat(seq(',', $.map_entry)),
        optional(','),
      )),
      '}',
    ),

    map_entry: $ => seq(
      field('name', $.identifier),
      ':',
      field('value', $.value),
    ),

    // `Count is ${bridge.count}` — a string with interpolated values.
    template_string: $ => seq(
      '`',
      repeat(choice(
        $.template_interpolation,
        $._template_text,
        $.escape_sequence,
      )),
      '`',
    ),

    template_interpolation: $ => seq('${', field('value', $.value), '}'),

    // Text between the holes. A bare `$` stays text, so only `${` starts one.
    _template_text: _ => token.immediate(prec(-1, /[^`\\$]+|\$/)),

    string: $ => seq(
      '"',
      repeat(choice(
        $._string_content,
        $.escape_sequence,
      )),
      '"',
    ),

    _string_content: _ => token.immediate(/[^"\\\n]+/),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /["\\/bfnrt]/,
        /u\{[0-9a-fA-F]{1,6}\}/,
        /u[0-9a-fA-F]{4}/,
      ),
    )),

    number: _ => {
      const digits = /[0-9]+(_[0-9]+)*/;
      const fraction = seq('.', digits);
      return token(seq(digits, optional(fraction)));
    },

    boolean: _ => choice('true', 'false'),

    // #rgb, #rrggbb, #rrggbbaa
    color: _ => token(seq(
      '#',
      choice(
        /[0-9a-fA-F]{8}/,
        /[0-9a-fA-F]{6}/,
        /[0-9a-fA-F]{3}/,
      ),
    )),

    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

    comment: _ => token(choice(
      seq('//', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
    )),
  },
});
