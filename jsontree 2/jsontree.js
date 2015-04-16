
/** 
 *  jsontree    -- A tree represents the json object and lets you edit it.
 *  
 *  - - - IMPORTANT - - - 
 *  This version of jsontree has been adapted to the SNC UI environment by changing all $ references
 *  to $j references to accomodate the no-conflict mode.
 *  
 * Author: John Maher
 *
 * REQUIRES: jquery 
 *
 * Usage: 
 * 
 *    $j(selector).jsontree(options)    initialize the tree and pass options.
 *    
 * Example:
 *     
 *    $jj("treediv").jsontree( {
 *       [optional]            data : {any json data}, 	  		// data can be string or direct object
 *       [optional]             url : '/actions/loadjson', 
 *                             menu : ['save', 'close'],
 *                         onSelectf : function(ctl, nod) {
 *                                    },
 *                           onMenu : function(name, ctl) {
 *                                    },
 *                           onEdit : function(ctl) {
 *                                    }
 *    });
 *
 *<pre>
 *   options:
 *      url:     the URL to fetch nodes from via AJAX when user expands nodes that have children which are not yet fetched
 *      data:    the json data to draw as a tree.  Use this or URL to fetch a tree
 *      format:  'json' - raw JSON, the tree displays and edits
 *               'meta' - json metadata in the form:
 *
 *                {
 *               	"name" : "child1",
 *               	"properties" : [ {
 *               		"name" : "two",
 *               		"properties" : {
 *               			"name" : "child1",
 *               			"properties" : [ {
 *               				"name" : "a1",
 *               				"type" : "STRING"
 *               			}, {
 *               				"name" : "a2",
 *               				"type" : "STRING"
 *               			} ]
 *               		},
 *               		"type" : "OBJECT"
 *               	}, {
 *               		"name" : "tree",
 *               		"type" : "STRING"
 *               	}, {
 *               		"name" : "one",
 *               		"type" : "STRING"
 *               	} ]
 *               }
 *
 *
 *               'data' - json metadata + data (values) in the form:
 *               {
 *               	"name" : "child1",
 *               	"properties" : [ {
 *               		"name" : "two",
 *               		"value" : {
 *               			"name" : "child1",
 *               			"properties" : [ {
 *               				"name" : "a1",
 *               				"value" : "a1",
 *               				"type" : "STRING"
 *               			}, {
 *               				"name" : "a2",
 *               				"value" : "a2",
 *               				"type" : "STRING"
 *               			} ]
 *               		},
 *               		"type" : "OBJECT"
 *               	}, {
 *               		"name" : "tree",
 *               		"value" : "three",
 *               		"type" : "STRING"
 *               	}, {
 *               		"name" : "one",
 *               		"value" : "one",
 *               		"type" : "STRING"
 *               	} ]
 *               }
 *
 *</pre>
 *    
 *  node fields: 
 *     selectable
 *     name
 *     children
 *    
 */
(function($j) {

	function i18n(txt) {  // todo; use latest message lookup
		return txt;
	}
	
    String.prototype.endsWith = function(str) {
        var startPos = this.length - str.length;
        if (startPos < 0) 
            return false;
        return (this.lastIndexOf(str, startPos) == startPos);
    }
    
    
    $j.fn.jsontree = function(options) {
        var opts = {
                url           : null,
                format        : "json",
                openClass     : "node-open", 
                closedClass   : "node-closed",
                leafClass     : "leaf",
                selectedClass : "selected",
                readonly      : false,
                openNode      : "/",				// path to node to initially open
                scroll        : "auto",
                menu          : [],         /* top-menu items */
                showMenu      : 'rclick',   /* this shows the context menu */
                onMenu        : function(name, ctl) {
                                    alert('Menu ' + ctl.attr('name'));                	
                                },
                onSelect      : function(ctl, nod) {
                                    alert("Selected : " + nod);                   
                                },
                json          : function(indent) {
                	                var rootdata = {};
                	                var root = this.ctl.parents('.jtree').children("ul.jtree-object").find("ul:first");
                	                
   		                            var opts = root.data('opts');

   		                            var newObj = {};
   		                            
     		                        if (opts.isMeta) {
     		                        	
     		                            // if meta data format (including 'data') then we create initial root
     		                            // object from the title
     		                            //
    		                            var name = root.parent().find('#title').text();
    		                            rootdata = { name: name, properties: {}, type: "object"};
                	                    walkNode.call( newObj, rootdata.properties, root, opts );
    		                        }
                                    else
                	                    walkNode.call( newObj, rootdata, root, opts );
                	                
                	                
              	                    var rslt = indent ? JSON.stringify(rootdata, null, 4) : JSON.stringify(rootdata);
                	                return rslt;
                                },
                fn : {
                    openFolder : function(nod) {
                        var fldr = $j($j(nod).children("img:first"));
                        fldr.removeClass(opts.closedClass).addClass(opts.openClass);
                        var childlist = fldr.parent().children("ul");
                        if (childlist.length === 0) {                               // dyna-load trees
                            var childs = loadNode( nod.attr('id') );
                            fldr.parent().append( makeChildren(childs, false) );
                        } else                                                      // pre-load trees.
                            $j(childlist).slideDown("fast");
                    },
                    collapseFolder : function(nod) {
                        var fldr = $j($j(nod).children("img:first"));
                        fldr.removeClass(opts.openClass).addClass(opts.closedClass);
                        if (opts.data === undefined)
                            fldr.parent().children("ul").remove();                   // dyna-load trees
                        else
                            fldr.parent().children("ul").slideUp("medium");            // pre-load trees
                    },
                    editLeaf : function(nod) {
                    	alert('-- leaf has no handler --');
                    },
                    newNode: function(clickedNode) {
                    	editNewItem( clickedNode, function(nam, val, typ) {
                          	var ul = clickedNode.children('ul');
                        	if (!ul || ul.length == 0) {
                                ul = $j("<ul class='jtree-object'>");       
                                ul.data('opts', opts);     
                            	
                                clickedNode.append(ul);
                                var img = clickedNode.find("img");
                                img.removeClass( opts.leafClass )
                                   .addClass( opts.closedClass ); 
                        	}
                            ul.append( makeChild(val, nam, typ) );
                    	});
                    }
                }
        };
        
        var words = {'boolean':'Boolean', 'string':'String', 'number':'Number', 'array':'Array', 'object':'Object'};
        
        $j.extend(opts, options);
            
        if ( (opts.url == null || opts.format != 'json')  && !opts.data)  
            opts.data = '';
        
        opts.count = count;        	
        opts.isMeta = opts.format == 'meta' || opts.format == 'data';

        
        function editNewItem(clickedNode, onSave) {
        	
            var pos = clickedNode.position();
            var adjust = 0; //-200;
            var nameValueEditor = $j("#nv-edit");

            if (opts.isMeta) {
                $j("#nv-val-col").hide();
                $j("#nv-val-title").hide();
            }
                            
            $j("button#nv-save").click(function() {
            	var nam =  $j("#nv-name").val();
            	var val =  $j("#nv-value").val();

            	var typ = (opts.isMeta) 
        	                 ? $j("#object-type option:selected").val()
        	                 : undefined;
        	                 
            	onSave(nam, val, typ);
            	
            	nameValueEditor.hide();
            	$j(this).unbind("click");
            });
            
            $j("button#nv-cancel").click(function() {
            	nameValueEditor.hide();
            	$j(this).unbind("click");
            });
            
            nameValueEditor.css({
                position: "absolute",
                     top: pos.top + "px",
                    left: (pos.left + adjust) + "px"
             }).show("slow");
            
            $j("#nv-value").val("");
            $j("#nv-name").val("").focus();
        }
        
        
        // Internals
        //
        function isRoot(node) {
            return $j(node).data("isRoot");
        }

        function hasTitle() {
            return opts.title && opts.title.length > 0;	
        }
        
        function hasMenu() {
            return opts.menu && opts.menu.length > 0;	
        }
        
        function makeRootNode(nodedata) {
        	if (!opts.title || opts.isMeta)
                opts.title = nodedata.name;
        
        	var html = $j( "<div class='jtree' style='height:100%;overflow:auto'>" +
                           "</div>" );
        	
        	if (hasTitle() || hasMenu()) {
        		html.append( "<table id='titlebar'><tr><td id='title'>" +
				             opts.title +
				             "</td><td id='status'>&nbsp;</td><td id='menu-bar'></td></tr></table>" );
	        	if (hasMenu())
	        		makeMenu(html);
        	}
        	
            var ul = $j("<ul class='jtree-object jtree-root'>");
			ul.data('opts', opts); 
			var rootNode = makeChild(nodedata, opts.title);
			rootNode.addClass("root");
            ul.append( rootNode );
            
        	html.append(ul);
            return html
        }

                        
        function makeChildren(node, hide) {
            var html = $j("<ul class='jtree-object' " + (hide ? " style='display:none'" : "") + ">");       
            html.data('opts', opts);     
            if (node instanceof Array)
            	html.data('array', true);
            
            var nod = html.append("</ul>");
            
            if (typeof node === 'object') {
            	
            	if (opts.isMeta)
            	    processMetaNode(html, node);
            	else
            		processJsonNode(html, node);
            }
            return  nod;
            
        }
        
        
        function processMetaNode(html, node) {
        	if (typeof node.properties == 'undefined') 
        		return;
        	
        	if (node.properties instanceof Array) 
        	    processArrayChildren(node, html);
        	else
        	    processObjectChildren(node, html);
        	    
        	function processArrayChildren(node, html) {
                for (var i = 0; i < node.properties.length; i++) {
            	    var childdata = node.properties[i];
                    var nam = childdata.name;
        		    var typ = childdata.type; 
                    html.append( makeChild(childdata, nam, typ) ); 
                }
            }
            
        	function processObjectChildren(node, html, childs) {
                for (var x in node.properties) {
                    if (typeof x == 'undefined')
                        continue;
            	    var childdata = node.properties[x];
                    var nam = childdata.name;
        		    var typ = childdata.type; 
                    html.append( makeChild(childdata, nam, typ) ); 
                }
            }
        }
        
        function processJsonNode(html, node) {
            for (var name in node) 
            	if (name !== undefined) {
            		var nodedata = node[name];
                    html.append( makeChild(nodedata, name) ); 
            	}
        }

        function makeChild(nodedata, name, typ) {
            var css_class = "hand " + opts.leafClass;
            if (hasChildren(nodedata))  
               css_class = "hand " + opts.closedClass; 
            
            var li = $j("<li></li>");
            li.attr("id", id(nodedata, name))
              .data("opts", opts);
            
            if (typeof typ !== 'undefined')
            	li.attr("type", typ);
            
            var link = $j("<img src='images/transparent.gif'></img>");
            li.append(link);
            link.attr("class", css_class);
            link.click( function() { 
            	$j.jsontree.toggleNode($j(this).parent()); 
            });
            
            li.append( makeNodeDisplay(nodedata, name) );
            
            if (opts.data !== undefined && hasChildren(nodedata))
                li.append( makeChildren(nodedata, true) );
            
            return li;
            
            function dropData(evt, ui) {
            	alert('drop ' + ui);
            }
        }
        
        function makeNodeDisplay(nodedata, name) {
        	var nodeid = id(nodedata, name);
        	var node = $j("<span/>").attr("id", "n_" + nodeid)
        	                        .addClass("node")
        	                        .bind("contextmenu", $j.jsontree.onContext)
            				        .append("-").append( spName(name) ).append(":")
            				        .append( makeNode(nodedata) );
        	
            if (nodedata.selectable !== undefined && "true" == (nodedata.selectable+"").toLowerCase()) 
                node.click( function() { $j.jsontree.onSelect($j(this).parent()); } );
            return node;
        }
        
        function spName(nam) {
        	return $j("<span class='node-name'/>").text(nam);
        }
        
        function makeNode(nodedata) {
        	var nod = $j("<span/>").addClass("hand node-value")
        	                       .attr("title", i18n("Double click to edit"))
        	                       .dblclick( function() { $j.jsontree.onEdit($j(this)); } )
                                   .html( nodeValue(nodedata) ); 
        	return nod;
        }

        function nodeValue(nodedata) {
            if (typeof nodedata.type !== 'undefined') 
                return addNodeType(nodedata.type.toLowerCase());
                
        	if (typeof nodedata === "object")
        		return "";
        	
            if (typeof nodedata === "undefined" || typeof nodedata === "function")
        		return typeof nodedata;
        	else
        	    return nodedata+'';
        	    
            function addNodeType(nodeType) {
                return "<span class='data-type' title='" +
                           words[nodeType] +
                       "'><img src='images/" + 
                           nodeType + 
                       ".png' /></span>";
            }
        }
        
        
        function makeMenu(html) {
        	var menu = $j(html).find('#menu-bar');
        	for (var i = 0; i < opts.menu.length; i++)
        		menu.append( menuItem(opts.menu[i]) ).append("&nbsp;");
            return menu;
        }
        
        function menuItem(name) {
        	if (name.length < 2)
        		return "";
        	
        	var title = name;
        	var name = name.toLowerCase();
        	var item = $j("<img src='images/menu_" + name + ".png' title='" + title + "'/>");
        	item.click( function() { $j.jsontree.onMenu(name, $j(this)); } );
        	item.data("opts", opts);
        	return item;
        }

        function id(nodedata, name) {
        	return nodedata.sys_id === undefined ? (nodedata.id == undefined ? name : nodedata.id) : nodedata.sys_id
        }
        
        // Load a node from a URL
        // this is asyncronous and wont work...
        function loadNode(id) {
            var nodeData;
            $j.ajax({
                url : opts.url + "?id="+id,
              async : false,
            success : function(data) {
                          nodeData = data.nodes;
                      },
              error : function(rslt,stat) {
                          alert(rslt.responseText);
                      }
            });
            return nodeData;
        }
        
        // parse data from direct JSON
        function parseData(json) {
            try {
            	if (json === undefined || (typeof json !== 'string') ||  json === '')
            		return {};
                var root = JSON.parse(json);
                return root;
            } catch (e) {
                alert(i18n("Error") + ":" + e);
            }
        }
        
        function hasChildren(node) {
            return count(node) > 0; 
        }
        
        function count(obj) {
        	if (typeof obj != 'object') 
        		return 0;

            if (opts.isMeta) {
                if (typeof obj.properties === 'array')
                    return obj.properties.length;
                else if (typeof obj.properties === 'object')
                    return countKeys(obj.properties);
                else
                    return 0;
            }
                    
            return countKeys(obj);
        }
        
        function countKeys(obj) {        		
            if (Object.keys)  
                return Object.keys(obj).length;
                
            var c = 0;
            for (var p in obj) 
                if (obj.hasOwnProperty(p)) 
                    c += 1;
                    
            return c;
        }
        
        function openNode(root, path) {
            path = path.trim();
            if (path == "/") {
            	openTheNode( $j(root) );
            	return;
            }
            
            if (path.charAt(0) == "/")
                path = path.substring(1);

            var parts = path.split("/");
            var nod = $j(root).find("#ulroot>li");
            
            for (var i = 0; i < parts.length; i++)
                nod = open(nod, parts[i], i == parts.length-1);
        }
        
        function open(parent, nodeName, selectIt) {  
            var li = parent.find("li:first");
            $j(parent).children("ul").children("li").each(function() {
                if ($j(this).data("node").path.endsWith("/"+nodeName)) {
                    li = this;
                    return false;
                }
            });
            
            if (selectIt) 
                selectTheNode($j(li), nodeName);
            else
                openTheNode($j(li));
            return li;
        }

        function selectTheNode(nod, nodeName) {
            var a = nod.children("a[id^='n_']");
            if (nod.data("node").path.endsWith("/"+nodeName))
                $j(a).addClass(opts.selectedClass);
        }
        
        function openTheNode(nod) {
        	nod.find("img.node-closed:first").click();
        }
        
        
        function makeContextMenu() {
            var ctxMenu = $j( 
            		"<div id='ctx-menu'>" +
            		"  <div class='ctx-menu'><table><tr><td>" + i18n('Menu') + "<td><td class='menu-closer' style='text-align:right'></td></tr></table></div>" +
                    "  <ul class='menu'>" +
                    "    <li name='add'>"+ i18n('Add') + "</li>" +
                    "    <li name='remove'>" + i18n('Remove') + "</li>" +
                    "    <li name='copy'>" + i18n('Copy') + "</li>" +
                    "  </ul>" +
                    "</div>" ); 

            var closer = ctxMenu.find("td.menu-closer");
            closer.append("<img src='images/close.png'>");
            closer.click( function(){ $j("#ctx-menu").hide(); } );
            
            ctxMenu.find("li").click( $j.jsontree.onCtxMenuItem );

//            ctxMenu.mouseout( function(evt) {
//            	        var targ = $j(evt.target);
//            	        if (targ.closest("div").attr("id", "ctx-menu"))
//                    	    return;   
//            	        ctxMenu.hide();
//                	});
            
            return ctxMenu;
        }

        function makeNvEdit() {
        	
        	var TYPE_OPTIONS = 
        		"<select id='object-type'>" +
        		  "<option value='string' selected='selected'>" + i18n('String') + "</option>" +
        		  "<option value='boolean'>" + i18n('Boolean') + "</option>" +
        		  "<option value='number'>" + i18n('Number') + "</option>" +
        		  "<option value='object'>" + i18n('Data Object') + "</option>" +
        		"</select>";
        	
        	return $j( "<div id='nv-edit'>" + 
                       "<table border='0'>" + 
                       	"<tr>" +
                       		"<th width='40px'>" + i18n('Name') + "</th>" +
                       		"<th width='40px' id='nv-val-title'>" + i18n('Value') + "</th>" +
                        	"<th id='nv-type-title'>" + i18n('Type') + "</th>" +
                        "</tr>" + 
                        "<tr>" +
                        	"<td><input id='nv-name'/></td>" +
                        	"<td id='nv-val-col'><input id='nv-value'></td>" +
                        	"<td id='nv-type'>" + TYPE_OPTIONS + "</td>" +
                        "</tr>" + 
                        "<tr>" + 
                    		"<td></td>" +
                        	"<td><button type='button' id='nv-cancel'>" + i18n('Cancel') + "</button></td>" +
                        	"<td><button type='button' id='nv-save'>" + i18n('Save') + "</button></td>" +
                        "</tr>" + 
                       "</table>" + 
                       "</div>" );
        }

        function makeCopyEdit() {
            var editPanel=
            	   $j( "<div id='cp-edit'>" + 
                       "  <div class='button-bar'><div class='button-bar-title'>" +
            			    i18n("Copy as JSON") + "</div> <img id='close-button' src='images/close.png' title='" + i18n('Close') + "' /></div>" + 
                       "  <div style='clear:both'><textarea id='copy-paste'></text><div>" + 
                       "</div>" );
            
            // todo:  all close buttons in popup divs should share the same code.. something like $(this).parent('[class='popup']).attachClose();
            editPanel.find('#close-button').click( function(ctl) {
            	editPanel.hide("medium").css({width:'10px', height:'10px'});
            });
            return editPanel;
        }
        
        function copy(text) {
            if (window.clipboardData) // IE
                window.clipboardData.setData("Text", text);
            else {  
                unsafeWindow.netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");  
                const clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);  
                clipboardHelper.copyString(text);
            }
        }        

        
        
        // json serialization support
        //
        
        /** 
         *  Walk a 'UL' element and 
         *  create a property for it in 'data' 
         */
    	function walkNode(data, ul, opts) {
    		var self = this;
    		    		
            ul.children("li").each(function(idx, elem) {
                addChild( data, $j(elem), opts ); 
            });
            
            function addChild(data, li, opts) {
                var name = li.find("span.node-name:first").text();
                
            	// if children then this is a object node else it is a value (leaf) node
            	//
            	var children = li.children("ul");
            	if (children.length == 0) {
            	
            	    // LEAF
                    var valu = li.find("span.node-value:first").text();
                    
                    if (opts.isMeta) {
                    
                        var typ = li.attr('type');
                        var childNode = makeChildObject( typ, name, false );
                        if (data instanceof Array)   //typ == 'array')
                	        data.push( childNode );
                	    else
                	        data[name] = childNode;
                	        
                	} else
                	    data[name] = valu;
                	    
                } else {
                    
                    if (opts.isMeta) {
                    
                        var typ = li.attr('type');
                        var childNode = makeChildObject( typ, name, true );
                        if (data instanceof Array)  //typ == 'array')
                            data.push(childNode);
                        else
                            data[name] = childNode;
                                                
            		    walkNode( data[name].properties, children, opts );
            		    
                    } else {
            		    data[name] = children.data('array') ? [] : {};
            		    walkNode( data[name], children, opts);
            		}
            	}


            	function makeChildObject(typ, nam, includeProperties) {
            	    var child = { name: nam, type: typ };
            	    if (includeProperties)
            	        child.properties = typ == 'array' ? [] : {};
            	    return child;
                }
                
            	function parentType(li) {
            	    return $j(li.parents('li')[0]).attr('type');
            	}
            }
            
        }
        
        
        
        // CORE - each macthing selector... 
        
        var nodeData = opts.data === undefined ?  loadNode(0) : parseData(opts.data);
        if (nodeData instanceof Array)
            nodeData = nodeData.pop();
        
        this.each(function() {
            this.opts = opts;
            
            if ($j("#ctx-menu").length == 0)
            	$j("body").append( makeContextMenu() )
            	          .append( makeNvEdit() )
	                      .append( makeCopyEdit() );
            
            $j(this).empty().addClass("jtree-container").append( makeRootNode(nodeData) );
            if (opts.openNode != null) 
                openNode(this,opts.openNode);
            
            // edit cancel
            $j(".node,.node-name,.node-value").click( function(evt) { 
                if ($j(evt.target).attr('id') === 'node-editor')
                    return;
                    
                $j.jsontree.cancelEdit($j(this)); 
                return true; 
            } );
        });
        return this;
    };

    // Event support
    $j.jsontree =  {


        toggleNode: function(nod) {
            var ctl = $j($j(nod).children("img:first"));

            var opts = $j(nod).data("opts");
            if (ctl.hasClass(opts.leafClass)) 
            	opts.fn.editLeaf(ctl);
            else
	            if (ctl.hasClass(opts.closedClass)) 
	                opts.fn.openFolder(nod);
	            else 
	                opts.fn.collapseFolder(nod);
        },
        
        onSelect: function(nod) {
        	var oCtl = $j(nod);
            var opts = oCtl.data("opts");
            opts.onSelect(oCtl, opts);
        },
        
        onContext: function(evt) {
        	var oCtl = $j(this).closest("li");
        	
            var ctxMenu = $j("#ctx-menu");
            ctxMenu.find("li[name='remove']").toggle( !oCtl.hasClass("root") );
            ctxMenu.css({
                top: evt.pageY+'px',
                left: evt.pageX+'px'
            }).data('firedby', oCtl)
              .show();

            return false;

        },

        onMenu: function(name, nod) {
        	var oCtl = $j(nod);
            var opts = oCtl.data("opts");
            opts.ctl = oCtl;  // fwd the ctrl back through opts for use in json() above (secret squirrel)
            var ret = opts.onMenu(oCtl, name, opts);
          	this.showStatus(ret);
        },
        
        showStatus: function(status) {
            $j("#status").text(status).fadeIn(800).delay(1400).fadeOut(800);
        },
        
        onCtxMenuItem: function(evt) {
            var menu = $j("#ctx-menu");
            
       	    menu.hide("slow").parent().unbind("mouseout"); 
       	    
       	    var firedBy = $j(menu.data('firedby'));
            var opts = $j(firedBy).data("opts");

        	if ( "remove" == $j(this).attr("name") ) 
	       		firedBy.remove();
        	else if ( "add" == $j(this).attr("name") ) {
        		opts.fn.newNode(firedBy);
        	}
        	else if ( "copy" == $j(this).attr("name") ) {
        		var json = {};
        		$j.jsontree.addChild(json, firedBy, opts);
        		var cpEdit = $j("#cp-edit");

        		// todo: use 1.8 pos method here and below
        		var pos = firedBy.position();
                var adjust = 0; //-200;
        		cpEdit.css({
                    position: "absolute",
                         top: pos.top + "px",
                        left: (pos.left + adjust) + "px"
                }).show("medium");
        		$j("#copy-paste").text( JSON.stringify(json) ).focus().select();
        	}
        },
        
        onEdit: function(nod) {
        	var opts = $j(nod.closest("li")).data('opts');
        	if (opts.readonly)
        		return;
        	
        	var orgSpan = nod.clone();
        	orgSpan.dblclick(  function() {$j.jsontree.onEdit(orgSpan) }  );
        	var editor = $j("<input id='node-editor' type='text' value='" + nod.text() + "'/>");
        	editor.bind("focusout", editFinish)
        	      .bind("keypress", function(evt) {
        	    	  var code = evt.keyCode ? evt.keyCode : evt.which;
        	    	  if (code == 13)
        	    		  editFinish(evt);
        	      });
        	      
        	nod.replaceWith(editor);
        	
        	this.editor = editor;
        	this.editor.cancel = function() {
        		editor.replaceWith( orgSpan );
        	}
        	
            function editFinish(evt) {
            	orgSpan.addClass("json-changed");
        		var newvalu = orgSpan.html( evt.currentTarget.value );
        		editor.replaceWith( newvalu );
            }
        },
        
        cancelEdit: function(nod) {
            if (this.editor) {
            	this.editor.cancel();
            	this.editor = null;
            }
        }
        
    };
    
})(jQuery);


