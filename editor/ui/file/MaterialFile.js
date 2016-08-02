"use strict";

function MaterialFile(parent)
{
	File.call(this, parent);

	//Material pointer
	this.material = null;

	//Self pointer
	var self = this;

	//Use to store original material color on highlight
	this.material_color = new THREE.Color(0, 0, 0);
	this.material_highlighted = false;

	//Mouse over event
	this.element.onmouseenter = function()
	{
		self.element.style.cursor = "pointer";
		self.element.style.backgroundColor = Editor.theme.button_over_color;
		self.highlightMaterial();
	};

	//Mouse leave event
	this.element.onmouseleave = function()
	{
		self.element.style.cursor = "default";
		self.element.style.backgroundColor = "";
		self.restoreMaterial();
	};

	//Double click
	this.element.ondblclick = function()
	{
		if(self.material instanceof THREE.Material)
		{
			//Check if there is already a tab with this material attached
			var found = false;
			for(var i = 0; i < Interface.tab.options.length; i++)
			{
				if(Interface.tab.options[i].component instanceof MaterialEditor)
				{
					if(Interface.tab.options[i].component.material === self.material)
					{
						found = true;
						Interface.tab.selectOption(i);
						break;
					}
				}
			}

			//If not found open new tab
			if(!found)
			{
				self.restoreMaterial();

				var tab = Interface.tab.addOption(self.material.name, Interface.file_dir + "icons/misc/material.png", true);
				var material_editor;

				if(self.material instanceof THREE.MeshPhongMaterial)
				{
					material_editor = new PhongMaterialEditor();
				}
				else if(self.material instanceof THREE.MeshBasicMaterial)
				{
					material_editor = new BasicMaterialEditor();
				}
				else if(self.material instanceof THREE.MeshStandardMaterial)
				{
					material_editor = new StandardMaterialEditor();
				}
				else if(self.material instanceof THREE.SpriteMaterial)
				{
					material_editor = new SpriteMaterialEditor();
				}
				else
				{
					material_editor = new MaterialEditor();
				}

				material_editor.attachMaterial(self.material, self);
				tab.attachComponent(material_editor);
				tab.select();
			}
		}
	};

	//Context menu event
	this.element.oncontextmenu = function(event)
	{
		var context = new ContextMenu();
		context.size.set(130, 20);
		context.position.set(event.clientX - 5, event.clientY - 5);
		
		context.addOption("Rename", function()
		{
			if(self.material !== null)
			{
				self.material.name = prompt("Rename material", self.material.name);
				self.updateMetadata();
			}
		});
		
		context.addOption("Delete", function()
		{
			if(self.material !== null)
			{
				if(confirm("Delete material?"))
				{
					Editor.program.removeMaterial(self.material, Editor.default_material, Editor.default_sprite_material);
					Editor.updateObjectViews();
				}
			}
		});

		context.addOption("Copy", function()
		{
			if(self.material !== null)
			{
				try
				{
					App.clipboard.set(JSON.stringify(self.material.toJSON()), "text");
				}
				catch(e){}
			}
		});
	};

	//Drag start
	this.element.ondragstart = function(event)
	{
		//Restore material color
		self.restoreMaterial();

		//Insert material into drag buffer
		if(self.material !== null)
		{
			event.dataTransfer.setData("uuid", self.material.uuid);
			DragBuffer.pushDragElement(self.material);
		}

		//To avoid camera movement
		Mouse.updateKey(Mouse.LEFT, Key.KEY_UP);
	};

	//Drag end (called after of ondrop)
	this.element.ondragend = function(event)
	{
		//Try to remove material from drag buffer
		var uuid = event.dataTransfer.getData("uuid");
		var obj = DragBuffer.popDragElement(uuid);
	};

	//Drop event
	this.element.ondrop = function(event)
	{
		event.preventDefault();
	};

	//Prevent deafault when object dragged over
	this.element.ondragover = function(event)
	{
		event.preventDefault();
	};
}

//Functions Prototype
MaterialFile.prototype = Object.create(File.prototype);
MaterialFile.prototype.destroy = destroy;
MaterialFile.prototype.setMaterial = setMaterial;
MaterialFile.prototype.highlightMaterial = highlightMaterial;
MaterialFile.prototype.restoreMaterial = restoreMaterial;
MaterialFile.prototype.updateMetadata = updateMetadata;

//Destroy material file
function destroy()
{
	File.prototype.destroy.call(this);
	this.restoreMaterial();
}

//Set object to file
function setMaterial(material)
{
	if(material instanceof THREE.Material)
	{
		Editor.material_renderer.renderMaterial(material, this.img);
		this.setText(material.name);
		this.material = material;
	}
}

//Highlight material
function highlightMaterial()
{
	if(this.material instanceof THREE.Material)
	{
		if(this.material.color !== undefined)
		{
			this.material_color.copy(this.material.color);
			this.material.color.setRGB(1, 1, 0);
			this.material_highlighted = true;
		}
	}
}

//Restore material to normal color
function restoreMaterial()
{
	if(this.material_highlighted)
	{
		if(this.material instanceof THREE.Material)
		{
			if(this.material.color !== undefined)
			{
				this.material.color.copy(this.material_color);
				this.material_highlighted = false;
			}
		}
	}
}

//Update material preview
function updateMetadata()
{
	if(this.material !== null)
	{
		Editor.material_renderer.renderMaterial(this.material, this.img);
		this.setText(this.material.name);
	}
}
