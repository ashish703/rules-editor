import { NestedTreeControl } from '@angular/cdk/tree';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { CodeEditorService, CodeModel } from '@ngstack/code-editor';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { FileDatabase } from './file-database';
import { FileNode, FileNodeType } from './file-node';

@Component({
  selector: 'app-code-editor-demo',
  templateUrl: './code-editor-demo.component.html',
  styleUrls: ['./code-editor-demo.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [FileDatabase],
})
export class CodeEditorDemoComponent implements OnInit {
  nestedTreeControl: NestedTreeControl<FileNode>;
  nestedDataSource: MatTreeNestedDataSource<FileNode>;

  themes = [
    { name: 'Visual Studio', value: 'vs' },
    { name: 'Visual Studio Dark', value: 'vs-dark' },
    { name: 'High Contrast Dark', value: 'hc-black' },
  ];

  selectedModel: CodeModel = null;
  activeTheme = 'vs-dark';
  readOnly = false;
  isLoading = false;
  isLoading$: Observable<boolean>;

  @ViewChild('file')
  fileInput: ElementRef;

  options = {
    contextmenu: true,
    minimap: {
      enabled: false,
    },
  };

  /*************** */

  myControl = new FormControl();
  optionsArr: string[] = ['One', 'Two', 'Three'];
  filteredOptions: Observable<string[]>;
  ruleSetTypesOptions: Observable<string[]>;

  ruleForm: FormGroup;
  sourceCode = ['// JScript source code'];
  funcParams: string[] = ['param', 'Source', 'RefSourceName', 'ObjectName', 'RuleStr', 'TocID', 'SourceName', 'Rule', 'xmlString'];
  actionsArr: string[] = ['Read From Source', 'Read Shape File', 'Inset Log'];
  showFilePath = false;



  ruleSetTypes: string[] = ['Completeness', 'Correction', 'Data Changed', 'Validity'];
  dataTypes: string[] = ['WellBore', 'Dev Survey', 'Log Curve'];
  elements = [
    {
      name: 'UWI',
      attributes: []
    },
    {
      name: 'Elevation',
      attributes: ['Ref']
    },
    {
      name: 'SpudDate',
      attributes: []
    },
    {
      name: 'SurfaceLocation',
      attributes: ['Lat', 'Lon', 'LatWGS84', 'LonWGS84']
    }, {
      name: 'BottomHoleLocation',
      attributes: ['LatWGS84', 'LonWGS84']
    }
  ];
  attributes = [];
  actions = [{
    name: 'Comparision Operations',
    actions: [
      { value: '==', viewValue: '==' },
      { value: '>=', viewValue: '>=' },
      { value: '>', viewValue: '>' },
      { value: '<=', viewValue: '<=' },
      { value: '<', viewValue: '<' }
    ]
  }]






  /****************** */

  constructor(database: FileDatabase, editorService: CodeEditorService, private formBuilder: FormBuilder) {
    this.nestedTreeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();

    database.dataChange.subscribe(
      (data) => (this.nestedDataSource.data = data)
    );

    this.isLoading$ = editorService.loadingTypings.pipe(debounceTime(300));
  }

  hasNestedChild(_: number, nodeData: FileNode): boolean {
    return nodeData.type === FileNodeType.folder;
  }

  private _getChildren = (node: FileNode) => node.children;

  onCodeChanged(value) {
    this.sourceCode = value.split('\n');
    console.log(this.sourceCode)
  }

  isNodeSelected(node: FileNode): boolean {
    return (
      node &&
      node.code &&
      this.selectedModel &&
      node.code === this.selectedModel
    );
  }

  selectNode(node: FileNode) {
    this.isLoading = false;
    console.log(node);
    this.selectedModel = node.code;
  }

  ngOnInit() {

    this.selectedModel = {
      language: 'javascript',
      uri: 'main.js',
      value: this.sourceCode.join('\n')
    };

    /******************* */

    this.createFrom();

    // this.filteredOptions = this.ruleForm.get('action').valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(this.actionsArr, value))
    // );


    this.ruleSetTypesOptions = this.ruleForm.get('ruleSetType').valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.ruleSetTypes, value))
    );

  }

  onEditorLoaded() {
    console.log('loaded');
  }

  /***************************** */
  private _filter(Arr, value: string): string[] {
    const filterValue = value.toLowerCase();

    return Arr.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  createActionsField() {
    this.t.push(this.formBuilder.group({
      action: new FormControl(),
      staticValue: new FormControl(),
      element: new FormControl(),
      attribute: new FormControl()
    }));
  }

  // convenience getters for easy access to form fields
  get f() { return this.ruleForm.controls; }
  get t() { return this.f.actionGroup as FormArray; }

  createFrom() {

    this.ruleForm = this.formBuilder.group({
      ruleSetType: new FormControl(''),
      funcName: new FormControl(''),
      dataSource: new FormControl(''),
      dataType: new FormControl(''),
      actionGroup: new FormArray([])
    });
    this.createActionsField();

  }

  updateCode() {

    this.selectedModel = {
      language: 'javascript',
      uri: 'main.js',
      value: this.sourceCode.join('\n')
    };

  }

  createFunction() {
    this.sourceCode.push(
      `function ${this.ruleForm.value.funcName}_${this.ruleForm.value.ruleSetType}(ObjectName,TocID,SourceName,RefSourceName,Rule,xmlString){`,

      '}'
    );

    this.updateCode();
  }

  pressEnter(event) {
    // if (event.charCode === 13) {
    //   this.createFunction();
    // }

  }

  ruleSetTypeSelected(event) {

  }

  paramsSelected(event) {
    this.sourceCode[1] = `function ${this.ruleForm.value.funcName}(${event.value.join(',')}){`
    this.updateCode();
  }

  checkForInit() {
    let fountAt = -1;
    this.sourceCode.forEach((line, index) => {
      if (line.indexOf('function Init(') > -1) {
        fountAt = index;
      }
    });
    if (fountAt === -1) {
      this.sourceCode.forEach((line, index) => {
        if (line.indexOf('function') > -1) {
          fountAt = index;
        }
      });

      this.sourceCode.splice(fountAt, 0, 'function Init(){', '}');
      this.updateCode();
    }
    fountAt++;
    return fountAt;
  }

  addLogActiveX() {
    if (this.sourceCode.indexOf('var g_ASILog;') === -1) {
      this.sourceCode.splice(1, 0, 'var g_ASILog;');
      const foundAt = this.checkForInit();
      this.sourceCode.splice(foundAt, 0, ' g_ASILog = new ActiveXObject("ILXDisp.ILXLog");');
    }
  }


  filePathAded() {
    if (this.sourceCode.indexOf('var g_ilxCntyShapeFile;') === -1) {

      this.sourceCode.splice(1, 0, `var filePath =  '${this.ruleForm.value.filePath}';`);
      this.sourceCode.splice(1, 0, 'var g_ilxCntyShapeFile;');
      const foundAt = this.checkForInit();
      this.sourceCode.splice(
        foundAt,
        0,
        ' var FileErr',
        ' g_ilxCntyShapeFile = new ActiveXObject("ILXDisp.ILXShape");',
        ' FileErr = g_ilxCntyShapeFile.Open(filePath,"r");',
        ' if( FileErr ){',
        '  g_ASILog.print(0,"[SCRIPT ERROR]Failed to open County shape file.  Check path in script file.");',
        '  g_ilxCntyShapeFile = null;',
        ' }'
      );

      this.addLogActiveX();
    }
    this.updateCode();
  }


  dataSourceAdded() {
    this.sourceCode.splice(
      1,
      0,
      'var g_ASILog;',
      'var g_xmlDoc;',
      `var g_Source = '${this.ruleForm.value.dataSource}';`);
    const foundAt = this.checkForInit();
    this.sourceCode.splice(
      foundAt,
      0,
      ' g_ASILog = new ActiveXObject("ILXDisp.ILXLog");',
      ' g_xmlDoc = new ActiveXObject("Msxml2.DOMDocument");',
      ' g_xmlDoc.async = false;'
    );
    this.updateCode();
  }

  dataTypeSelected(event) {

  }

  findMainFunction() {
    let fountAt = -1;
    this.sourceCode.forEach((line, index) => {
      if (line.indexOf(`function ${this.ruleForm.value.funcName}`) > -1) {
        fountAt = index;
      }
    });

    return fountAt;
  }

  checkGetterFunction(funcName) {
    let fountAt = -1;
    this.sourceCode.forEach((line, index) => {
      if (line.indexOf(`function Get${funcName}`) > -1) {
        fountAt = index;
      }
    });

    return fountAt > -1 ? true : false;
  }

  attributesSelected(event, index) {

    if (!this.checkGetterFunction(this.ruleForm.value.actionGroup[index].element.replace(/ /g, ''))) {

      this.sourceCode.splice(
        this.findMainFunction(),
        0,
        `
function Get${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')}(attribute) {
  var elementValue = '';
  var attValue = "";
  var temp = "";

  var tempNode = g_xmlDoc.selectSingleNode("//${this.ruleForm.value.dataType}/${this.ruleForm.value.actionGroup[index].element}");
  if (tempNode != null && tempNode.text != '-99999') {
    temp = tempNode.getAttribute(attribute);
    if (temp != "") {
      attValue = parseFloat(tempNode.text);
      elementValue = attValue;
    }
  }

  return elementValue;
}​​
      `

      );
      this.updateCode();
    }
  }


  actionSelected(event, i) {

  }

  staticValueAdded(index) {

    let adjValue = 1;
    let code = `
    g_ASILog.print(2, "[${this.ruleForm.value.funcName}_${this.ruleForm.value.ruleSetType}] Starting Rule");
    g_xmlDoc.loadXML(xmlString);
    if (g_xmlDoc.parseError.errorCode > 0) {
      var myErr = g_xmlDoc.parseError;
      g_ASILog.print(0, "[ERROR] ${this.ruleForm.value.funcName}_${this.ruleForm.value.ruleSetType} - Parse Error=" + myErr);
      return (-1);
    }


    var ${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} = Get${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')}("${this.ruleForm.value.actionGroup[index].attribute}");
    if (${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} == ""){
      g_ASILog.print(2,"[${this.ruleForm.value.funcName}_${this.ruleForm.value.ruleSetType}] , ${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} null, skipping rule");
      return (-1);
    }

    if (${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} ${this.ruleForm.value.actionGroup[index].action} ${this.ruleForm.value.actionGroup[index].staticValue}){
      g_ASILog.print(2,"[${this.ruleForm.value.funcName}_${this.ruleForm.value.ruleSetType}] ,  ${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} ${this.ruleForm.value.actionGroup[index].action} ${this.ruleForm.value.actionGroup[index].staticValue}, passed rule");
      return (0);
    }
    `;

    if (index) {
      adjValue = 9;
      code = `
    var ${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} = Get${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')}("${this.ruleForm.value.actionGroup[index].attribute}");
    if (${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} == ""){
      g_ASILog.print(2,"[${this.ruleForm.value.funcName}_${this.ruleForm.value.ruleSetType}] , ${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} null, skipping rule");
      return (-1);
    }

    if (${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} ${this.ruleForm.value.actionGroup[index].action} ${this.ruleForm.value.actionGroup[index].staticValue}){
      g_ASILog.print(2,"[${this.ruleForm.value.funcName}_${this.ruleForm.value.ruleSetType}] ,  ${this.ruleForm.value.actionGroup[index].element.replace(/ /g, '')} ${this.ruleForm.value.actionGroup[index].action} ${this.ruleForm.value.actionGroup[index].staticValue}, passed rule");
      return (0);
    }
    `
    }

    this.sourceCode.splice(
      this.findMainFunction() + adjValue,
      0,
      code
    );
    this.updateCode();




  }


  elementsSelected(event, index) {

    this.attributes[index] = this.elements.find(ele => ele.name === event.value).attributes;

  }

  saveFile(){

  }
}


