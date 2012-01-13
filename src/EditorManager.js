/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/**
 * EditorManager owns the UI for the editor area and working set list. This essentially mirrors
 * the model in DocumentManager, which maintains a list of 'open' documents  (the working set) and
 * a 'current document' (what is shown in the editor area).
 */
define(function(require, exports, module) {
    
    // Load dependent modules
    var DocumentManager     = require("DocumentManager")
    ,   NativeFileSystem    = require("NativeFileSystem").NativeFileSystem
    ;
    
    // Initialize: register listeners
    $(DocumentManager).on("currentDocumentChange", _onCurrentDocumentChange);
    
    
    var _editorHolder = null;
    var _currentEditor = null;
    

    
    function _onCurrentDocumentChange(event) {
        console.log("Current document changed!  --> "+DocumentManager.getCurrentDocument());
        
        var doc = DocumentManager.getCurrentDocument();
        
        if (doc) {
            _showEditor(doc);
        } else {
            _showNoEditor();
        }
    }
    
    
    $(DocumentManager).on("workingSetAdd", function(event, addedDoc) {
        console.log("Working set ++ " + addedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
		
    });
	
    $(DocumentManager).on("workingSetRemove", function(event, removedDoc) {
        console.log("Working set -- " + removedDoc);
        //console.log("  set: " + DocumentManager.getWorkingSet().join());
		
    });
    
    $(DocumentManager).on("dirtyFlagChange", function(event, doc ) {
        console.log("Dirty flag change: " + doc);
		
    });
    
    
    
    /**
     * Designates the DOM node that will contain the currently active editor instance. EditorManager
     * will own the content of this DOM node.
     * @param {jQueryObject} holder
     */
    function setEditorArea(holder) {
        if (_currentEditor)
            throw new Error("Cannot change editor area after an editor has already been created!");
        
        _editorHolder = holder;
    }
    
    
    function createEditor(text) {
        var editor = CodeMirror(_editorHolder.get(0));
        
        // Apply NJ's editor-resizing fix
        // FIXME: is it bad to resize ALL editors, even invisible ones?
        // FIXME: remove listener when editor is destroyed
        var _resizeTimeout = null;
        $(window).resize(_updateEditorSize);
        
        function _updateEditorSize() {
            // Don't refresh every single time.
            if (!_resizeTimeout) {
                _resizeTimeout = setTimeout(function() {
                    editor.refresh();
                    _resizeTimeout = null;
                }, 100);
            }
            $('.CodeMirror-scroll', _editorHolder)
                .height(_editorHolder.height());
        }
        _updateEditorSize();
        
        
        // Initially populate with text. This will send a spurious change event, but that's ok
        // because no one's listening yet (and we clear the undo stack below)
        editor.setValue(text);
        
        // Make sure we can't undo back to the empty state before setValue()
        editor.clearHistory();
        
        return editor;
    }
    
    function destroyEditor(editor) {
        if (_currentEditor == editor)
            throw new Error("Shouldn't destroy the visible editor. See DocumentManager.closeDocument()");
        
        // Destroy the editor widget: CodeMirror docs for getWrapperElement() say all you have to do
        // is "Remove this from your tree to delete an editor instance."
        _editorHolder.get(0).removeChild( editor.getWrapperElement() );
    }
    
    
    function _showEditor(document) {
        // Hide whatever was visible before
        if (_currentEditor == null) {
            $("#notEditor").css("display","none");
        } else {
            $(_currentEditor.getWrapperElement()).css("display","none");
        }
        
        // Show new editor
        _currentEditor = document._editor;
        $(_currentEditor.getWrapperElement()).css("display", "");
    }
    function _showNoEditor() {
        if (_currentEditor != null) {
            $(_currentEditor.getWrapperElement()).css("display","none");
            _currentEditor = null;
            $("#notEditor").css("display","");
        }
    }
    
    
    function focusEditor() {
        if (_currentEditor != null)
            _currentEditor.focus();
    }
    
    
    // Define public API
    exports.setEditorArea = setEditorArea;
    exports.createEditor = createEditor;
    exports.destroyEditor = destroyEditor;
    exports.focusEditor = focusEditor;
    
});
