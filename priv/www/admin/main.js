
currenttab = undefined;

function switchtab(tab) {
	if (currenttab != tab){
		//onsole.log("switched tab to "+tab);
	}
	currenttab = tab;
}

function timeSince(timestamp){
	if(isNaN(timestamp)){
		return timestamp;
	}
	
	var now = Math.floor(new Date().getTime() / 1000);
	var elapsed = now - timestamp;
	if(elapsed < 60){
		return elapsed + " Sec";
	}
	elapsed = Math.floor(elapsed/60);
	if(elapsed < 60){
		return elapsed + " Min";
	}
	elapsed = Math.floor(elapsed/60);
	if(elapsed < 24){
		return elapsed + " Hours";
	}
	elapsed = Math.floor(elapsed/24);
	return elapsed + " Days";
}

function errMessage(message){
	dijit.byId('errorDialog').set('content', message.toString());
	dijit.byId('errorDialog').show();
}

function inArray(needle, haystack){
	for(var i = 0; i < haystack.length; i++){
		if(haystack[i] == needle){
			return true;
		}
	}
	return false;
}

dojo.addOnLoad(function(){
	dojo.query(".translate").forEach(function(node){
		var key = node.innerHTML;
		if(dojo.i18n.getLocalization('admin','labels')[key]){
			node.innerHTML = dojo.i18n.getLocalization('admin','labels')[key];
		}
	});
	dojo.query(".translatecol").forEach(function(node){
		var key = node.innerHTML;
		if(dojo.i18n.getLocalization('admin','labels')[key]){
			node.innerHTML = dojo.i18n.getLocalization('admin','labels')[key];
		}
		node.innerHTML += ":";
	});
			   
	dojo.parser.parse();

	var logoutdiv = dojo.byId('logoutButtonDiv');
	dojo.place(logoutdiv, dojo.byId('main_tablist'), 'first');
	//dojo.set(logoutdiv, 'class', 'rightFloater')
	
	var agentsSkillRefreshHandle = dojo.subscribe("skills/init", function(data){
		var skillsCallback = function(selectNode){
			selectNode.name = 'skills';
			dojo.place(selectNode, dojo.byId('agentSkills'), 'only');
			var out = new dijit.form.MultiSelect({}, selectNode);
		};
		
		skills.createSelect(skillsCallback, [], [], ['_brand', '_queue']);
				
		skills.refreshTree(dojo.byId('skillsList'));
	});

	var skillsTreeRefreshHandle = dojo.subscribe("skills/tree/refreshed", function(data){
		dijit.byId('skillGroup').store = skills.store;
		dojo.connect(skills.tree, 'onOpen', function(){
			dijit.byId('skillsTab').layout();
		});
		dojo.connect(skills.tree, "onClick", function(item){
			if(skills.store.getValue(item, 'type') == "skill"){
				dijit.byId('skillsMain').selectChild('skillEditor');
				dijit.byId('editSkill').set('value', item);
				var descendants = dijit.byId('editSkill').getDescendants();
				for(var i =0; i < descendants.length; i++){
					try{
						 descendants[i].set('disabled', skills.store.getValue(item, 'protected'));
					}
					catch(err){
						//ditching it sinse this will ususally be "this is a funciton" error
						//Prolly should test that first instead of shoving it to a try/catch.
					}
				}	
				dijit.byId('skillAtom').set('disabled', true);	
				dijit.byId('skillSubmit').onClick = function(){
					skills.updateSkill('editSkill', 'skillsList');
				}
			}
			else{
				dijit.byId('skillsMain').selectChild('skillGroupEditor');
				dijit.byId('editSkillGroupForm').set('value', item);
				dijit.byId('skillGroupOldName').set('value', item.name[0]);
				dijit.byId('skillGroupName').set('disabled', item.name[0] == "Magic");
			}
		});
	});

	var queueTreeRefreshHandle = dojo.subscribe("queues/tree/refreshed", function(data){
		dijit.byId('queueGroup').store = queues.store;
		dojo.connect(queues.tree, 'onOpen', function(){
			dijit.byId('queuesTab').layout();
		});
		dojo.connect(queues.tree, "onClick", function(item){
			if(queues.tree.store.getValue(item, 'type') == "queue"){
				dijit.byId("queuesMain").selectChild('queueEditor');
				dijit.byId('queueName').set('value', queues.tree.store.getValue(item, 'name'));
				dijit.byId('queueOldName').set('value', queues.tree.store.getValue(item, 'name'));
				dijit.byId('queueGroup').set('displayedValue', queues.tree.store.getValue(item, 'group'));
				
				var skillsSelected = queues.tree.store.getValues(item, 'skills');
				
				var skillsCallback = function(select){
					select.name = 'skills';
					dojo.place(select, dojo.byId('queueSkillsDiv'), 'only');
				};
				
				skills.createSelect(skillsCallback, skillsSelected, ['_agent', '_profile'], ['_profile']);
				/*var options = dojo.query('> optgroup > option', dijit.byId('queueSkills').domNode);
				for(var i = 0; i < options.length; i++){
					options[i].selected = inArray(options[i].value, skills);
				}*/
				dijit.byId('queueWeight').set('value', queues.tree.store.getValue(item, 'weight'));
				var recipe = queues.tree.store.getValue(item, 'recipe') ? queues.tree.store.getValue(item, 'recipe') : [];
				dijit.byId('queueRecipe').setValue(recipe);
				
				var callback = function(gitems, req){
					var gitem = gitems[0];
					dijit.byId("queueGroupRecipeDisplay").setValue(req.store.getValue(gitem, 'recipe'));
					dijit.byId("queueGroupRecipeDisplay").setDisabled(true);
				};
				queues.store.fetch({
					query:{type:'group', name:queues.tree.store.getValue(item, 'group')},
					onComplete:callback
				});
				
				dijit.byId('queueSubmit').onClick = function(){
					queues.setQueue(queues.tree.store.getValue(item, 'name'), dijit.byId('editQueueForm'), dijit.byId('queueRecipe'), 'queuesList');
				};
				
				dijit.byId('queueDropButton').onClick = function(){
					queues.deleteQueue(queues.tree.store.getValue(item, 'name'), 'queuesList');
				};
			}
			else{
				dijit.byId("queuesMain").selectChild('queueGroupEditor');
				dijit.byId("queueGroupOldName").set('value', queues.tree.store.getValue(item, 'name'));
				dijit.byId("queueGroupName").set('value', queues.tree.store.getValue(item, 'name'));
				dijit.byId("queueGroupSort").set('value', queues.tree.store.getValue(item, 'sort'));
				//var rec = queues.fromStoreToObj(item.recipe);
				dijit.byId("queueGroupRecipe").setValue(queues.tree.store.getValue(item, 'recipe'));
				dijit.byId("queueGroupName").set('disabled', queues.tree.store.getValue(item, 'protected'));
				dijit.byId("queueGroupSubmit").onClick = function(){
					queues.setGroup(dijit.byId("editQueueGroupForm"), dijit.byId("queueGroupRecipe"), "queuesList");
				};
				dijit.byId("queueDropButton").onClick = function(){
					queues.deleteGroup(queues.tree.store.getValue(item, 'name'), "queuesList");
				};
			}
		});
	});

	var moduleTreeRefreshHandle = dojo.subscribe("modules/tree/refreshed", function(data){
		dojo.connect(modules.tree, "onClick", function(item){
			modules.activeNode = modules.store.getValue(item, 'node');
			var node = modules.store.getValue(item, 'node');
			/*dijit.byId("mediaConf").onDownloadEnd = function(){
				dijit.byId("mediaSubmit").onClick = function(){
					medias.setMedia(node, medias.store.getValue(item, 'name'), dijit.byId("mediaForm").get('value'), 'mediaList');
				};
				dojo.publish("media/node/changed", [node]);
				dojo.xhrGet({
					url:"medias/" + node + "/" + medias.store.getValue(item, 'name') + "/get",
					handleAs:"json",
					load:function(resp, ioargs){
						if(resp.success){
							dijit.byId("mediaForm").set('value', resp);
							dijit.byId("mediaEnabled").set('value', resp.enabled);
						}
						else{
							//onsole.log(resp.message);
						}
					},
					error:function(resp){
						console.warn(["error get media", node, medias.store.getValue(item, 'name'), resp]);
					}
				});
			};*/
		
			if(item.type[0] == "conf"){
				dojo.requireLocalization("admin", modules.store.getValue(item, 'name'));
				dijit.byId("moduleConf").set('href', "openacd/modules/" + modules.store.getValue(item, 'name') + ".html");
			}
			dijit.byId("moduleMain").selectChild("moduleConf");
		});
		dojo.connect(modules.tree, 'onOpen', function(item, node){
			dijit.byId('moduleTab').layout();
		});
	});

	var agentsTreeRefreshHandle = dojo.subscribe("agents/tree/refreshed", function(data){
		dijit.byId('agentProfile').store = agents.store;
		dojo.connect(agents.tree, 'onOpen', function(){
			dijit.byId('agentsTab').layout();
		});
		dojo.connect(agents.tree, "onClick", function(item){
			if(agents.store.getValue(item, 'type') == "profile"){
				dijit.byId("agentProfileSubmit").onClick = function(){
					agents.updateProfile('editAgentProfileForm', 'agentsList');
				};
				dojo.byId("agentProfileOldName").value = agents.store.getValue(item, 'name');
				dijit.byId("agentProfileName").set("value", agents.store.getValue(item, 'name'));
				dijit.byId("agentProfileId").set("value", agents.store.getValue(item, 'id'));
				dijit.byId('agentProfileId').set('disabled', true);
				dijit.byId("agentProfileOrder").set("value", agents.store.getValue(item, 'order'));
				if(agents.store.getValue(item, 'name') == "Default"){
					dijit.byId("agentProfileName").set('disabled', true);
				}
				else{
					dijit.byId("agentProfileName").set('disabled', false);
				}
				dijit.byId('agentsMain').selectChild('agentProfileEditor');
				
				var skillCallback = function(selectNode){
					selectNode.name = 'skills';
					dojo.place(selectNode, dojo.byId('agentProfileSkills'), 'only');
					var out = new dijit.form.MultiSelect(selectNode);
				};
				
				var selectedSkills = [];
				var profileSkills = agents.store.getValues(item, 'skills');
				for(var i = 0; i < profileSkills.length; i++){
					var val = agents.store.getValue(profileSkills[i], 'atom');
					if(agents.store.getValue(profileSkills[i], 'expanded')){
						val = '{' + val + ',' + agents.store.getValue(profileSkills[i], 'expanded') + '}';
					}
					selectedSkills.push(val);
				}
				
				var expanded = ['_queue', '_brand'];
				
				skills.createSelect(skillCallback, selectedSkills, ['_brand', '_queue'], expanded);
				
				dijit.byId("agentsDestroyButton").onClick = function(){
					var name = agents.store.getValue(item, 'name');
					dojo.xhrGet({
						url:"agents/profiles/" + name + "/delete",
						handleAs:"json",
						load:function(response, ioargs){
							if( ! response.success){
								console.warn(response.message);
							}
							else{
								agents.refreshTree('agentsList');
							}
						}
					});
				};
			} else {
				var id = agents.store.getValue(item, 'id');
				dojo.xhrGet({
					url:"/agents/agents/" + id + "/get",
					handleAs:"json",
					load:function(response, ioargs){
						var agent = response.agent;
						dijit.byId("agentLogin").set("value", agent.login);
						dijit.byId("agentId").set('value', agent.id);
						//dijit.byId("agentProfile").set("value", agent.profile);
						dojo.byId("agentIntegrated").innerHTML = agent.integrated;
						dijit.byId("agentSecurity").set('value', agent.securitylevel);
						dijit.byId("agentProfile").set('displayedValue', agent.profile);
						dijit.byId("agentPassword").set('value', "");
						dijit.byId("agentConfirm").set('value', "");
						dijit.byId("agentLastName").set('value', agent.lastname);
						dijit.byId("agentFirstName").set('value', agent.firstname);
						var skillCallback = function(selectNode){
							selectNode.name = 'skills';
							dojo.place(selectNode, dojo.byId('agentSkills'), 'only');
						};
						var selectedSkills = [];
						for(var i = 0; i < agent.skills.length; i++){
							var val = agent.skills[i].atom;
							if(agent.skills[i].expanded){
								val = '{' + val + ',' + agent.skills[i].expanded + '}';
							}
							selectedSkills.push(val);
						}
						
						var expandSkills = ['_queue', '_brand'];
						
						skills.createSelect(skillCallback, selectedSkills, ['_queue', '_brand'], expandSkills);
					},
					error:function(res){
						console.warn("getting agent errored", res);
					}
				});
			
				dijit.byId('agentsMain').selectChild('agentEditor');
				dijit.byId('agentsDestroyButton').onClick = function(){
					var id = agents.store.getValue(item, 'id');
					dojo.xhrGet({
						url:"agents/agents/" + id + "/delete",
						handleAs:"json",
						load:function(response, ioargs){
							if(response.success){
								agents.refreshTree('agentsList');
							}
							else{
								console.warn(response.message);
							}
						}
					});
				};
			}
		});
	});

	dojo.addOnLoad(function(){
		var nlsStrings = dojo.i18n.getLocalization("admin", "labels");
		
		var loginform = dijit.byId("loginform");
		dojo.connect(loginform, "onSubmit", function(e){
			e.preventDefault();
			if (loginform.isValid()){
				dojo.xhrGet({
					url:"/getsalt",
					handleAs:"json",
					error:function(response, ioargs){
						dojo.byId("loginerrp").style.display = "block";
						console.warn(response);
						if (response.status){
							dojo.byId("loginerrspan").innerHTML = response.responseText;
						}
						else{
							dojo.byId("loginerrspan").innerHTML = "Server is not responding";
						}
					},
					load:function(response, ioargs){
						var salt = response.salt;
						var e = response.pubkey.E;
						var n = response.pubkey.N;
						var attrs = loginform.get("value");
						var values = attrs;
						var rsa = new RSAKey();
						rsa.setPublic(n, e);
						values.password = rsa.encrypt(salt + attrs.password);
						dojo.xhrPost({
							url:"/login",
							handleAs:"json",
							content:values,
							load:function(response2, ioargs2){
								if(response2.success){
									dijit.byId("loginpane").hide();
									dojo.byId("main").style.display="block";
									dojo.byId("main").style.visibility = "visible";
									dojo.byId("logoutButtonDiv").style.display="block";
									agents.init();
									agents.refreshTree("agentsList");
									skills.init();
									agents.getModules(dijit.byId('editAgentModuleForm'));
									agents.getSpiceIntegration(dijit.byId('editSpicecsmIntegration'));
									queues.init();
									queues.refreshTree('queuesList');
									modules.init();
									modules.refreshTree('moduleList');
									clients.init();
									releaseOpts.init();
									dojo.byId("loginerrspan").innerHTML = '';
									dojo.byId('loginerrp').style.display = 'none';
									agents.getModules(dijit.byId('editAgentModuleForm'));
								} else {
									dojo.byId("loginerrp").style.display = "block";
									dojo.byId("loginerrspan").innerHTML = response2.message;
									dijit.byId("loginpane").show();
								}
							}
						});
					}
				});
			}
		});
	//	var theForm = dijit.byId("editSkillPane");
		// another dojo.connect syntax: call a function directly	
	//	dojo.connect(theForm,"onsubmit",setSkill);
		
		dojo.xhrGet({
			url:"/checkcookie",
			handleAs:"json",
			error:function(response, ioargs){
				console.warn("checkcookie failed!");
				//onsole.log(response);
			},
			load:function(response, ioargs){
				if(response.success){
					dojo.byId("main").style.display="block";
					dojo.byId("main").style.visibility = "visible";
					dojo.byId("logoutButtonDiv").style.display="block";
					agents.init();
					agents.refreshTree("agentsList");
					skills.init();
					agents.getModules(dijit.byId('editAgentModuleForm'));
					agents.getSpiceIntegration(dijit.byId('editSpicecsmIntegration'));
					queues.init();
					queues.refreshTree('queuesList');
					modules.init();
					modules.refreshTree('moduleList');
					clients.init();
					releaseOpts.init();
					modules.getNodeStatus("moduleNodeInfo");
					//skills.skillSelection(dijit.byId('agentNewProfileSkills').domNode);
				}
				else{
					dijit.byId("loginpane").show();
				}
			}
		});
		
		/*dijit.byId("queueSkills").skillUpdateHandler = dojo.subscribe("skills/init", function(data){
			var callback = function(select){
				dojo.place(select, dojo.byId("queuesSkillsDiv"), "only");
				new dijit.form.MultiSelect({}, select);
			}
			//skills.skillSelection(dojo.byId("queueSkills"));
			//skills.newSelection(callback, [], [], ["_profile"]);
		});*/
	});
});
