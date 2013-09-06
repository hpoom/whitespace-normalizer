// TODO fix bug where replace to tabs inserts a tab over first space but leaves second space
/* global brackets, define */

define(function (/* require, exports, module */) {
  'use strict';

  var CommandManager = brackets.getModule('command/CommandManager'),
    Commands = brackets.getModule('command/Commands'),
    DocumentManager = brackets.getModule('document/DocumentManager'),
    Editor = brackets.getModule('editor/Editor').Editor,
    Menus = brackets.getModule('command/Menus'),
    PreferencesManager = brackets.getModule('preferences/PreferencesManager');

  function main(event, doc) {
    doc.batchOperation(function () {
      var line,
        lineIndex = 0,
        indent = setIndentChar(Editor),
        pattern,
        match;

      while ((line = doc.getLine(lineIndex)) !== undefined) {
        //trim trailing whitespaces
        pattern = /[ \t]+$/g;
        match = pattern.exec(line);
        if (match) {
          doc.replaceRange(
            '',
            {line: lineIndex, ch: match.index},
            {line: lineIndex, ch: pattern.lastIndex});

          line = doc.getLine(lineIndex);
        }

        //transform tabs to spaces
        pattern = /\t/g;
        // pattern = /[ ]{2}/g;
        match = pattern.exec(line);
        while (match) {
          doc.replaceRange(
            indent,
            {line: lineIndex, ch: match.index},
            {line: lineIndex, ch: pattern.lastIndex});

          line = doc.getLine(lineIndex);

          match = pattern.exec(line);
        }

        lineIndex += 1;
      }

      //ensure newline at the end of file
      line = doc.getLine(lineIndex - 1);
      if (line !== undefined && line.length > 0 && line.slice(-1) !== '\n') {
        doc.replaceRange(
          '\n',
          {line: lineIndex, ch: line.slice(-1)});
      }
    });

    CommandManager.execute(Commands.FILE_SAVE, {doc: doc});
  }

  function getIndentSize(editor) {
    return editor.getUseTabChar() ?
      editor.getTabSize() :
      (editor.getSpaceUnits ?
        editor.getSpaceUnits() /* Sprint 22+ */ :
        editor.getIndentUnit()
      );
  }

  function setIndentChar(editor) {
    return editor.getUseTabChar() ? '\t': new Array(getIndentSize(editor) + 1).join(' ');
  }

  function setEnabled(prefs, command, enabled) {
    $(DocumentManager)[enabled ? 'on' : 'off']('documentSaved', main);
    prefs.setValue('enabled', enabled);
    command.setChecked(enabled);
  }

  var PREFERENCES_KEY = 'com.github.dsbonev.WhitespaceNormalizer',
    prefs = PreferencesManager.getPreferenceStorage(PREFERENCES_KEY, {enabled: false}),
    enabled = prefs.getValue('enabled'),
    COMMAND_ID = PREFERENCES_KEY,
    onCommandExecute = function () {
      setEnabled(prefs, this, !this.getChecked());
    },
    COMMAND = CommandManager.register('Whitespace Normalizer', COMMAND_ID, onCommandExecute);

  setEnabled(prefs, COMMAND, enabled);

  var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
  menu.addMenuDivider();
  menu.addMenuItem(COMMAND_ID);
});
