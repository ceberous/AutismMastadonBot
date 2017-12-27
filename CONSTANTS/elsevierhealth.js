const RSS_URLS = [
	[
		"http://www.agajournals.org/current.rss" ,
		"http://www.awhonnjournals.org/current.rss" ,
		"http://www.aornjournal.org/current.rss" ,
		"http://www.academicpedsjnl.net/current.rss" ,
		"http://www.academicradiology.org/current.rss" ,
		"http://www.e-aat.com/current.rss" ,
		"http://www.advancesinanesthesia.com/current.rss" ,
		"http://www.ackdjournal.org/current.rss" ,
		"http://www.aimedjournal.com/current.rss" ,
		"http://www.advancesinophthalmology.com/current.rss" ,
		"http://www.advancesinpediatrics.com/current.rss" ,
		"http://www.advancesradonc.org/current.rss" ,
		"http://www.advancesinsmallanimal.com/current.rss" ,
		"http://www.advancessurgery.com/current.rss" ,
		"http://www.afjem.org/current.rss" ,
		"http://www.airmedicaljournal.com/current.rss" ,
		"http://www.dadm.alzdem.com/current.rss" ,
		"http://www.alzheimersanddementia.com/current.rss" ,
		"http://www.trci.alzdem.com/current.rss" ,
		"http://www.ahjonline.com/current.rss" ,
		"http://www.ajconline.org/current.rss" ,
		"http://www.ajemjournal.com/current.rss" ,
		"http://www.ajgponline.org/current.rss" ,
		"http://www.ajicjournal.org/current.rss" ,
		"http://www.ajkd.org/current.rss" ,
		"http://www.amjmed.com/current.rss" ,
		"http://www.ajog.org/current.rss" ,
		"http://www.ajo.com/current.rss" ,
		"http://www.ajocasereports.com/current.rss" ,
		"http://www.ajodo.org/current.rss" ,
		"http://www.amjoto.com/current.rss" ,
		"http://ajp.amjpathol.org/current.rss" ,
		"http://www.ajpmonline.org/current.rss" ,
		"http://www.americanjournalofsurgery.com/current.rss" ,
		"http://www.amjmedsci.org/current.rss" ,
		"http://www.anaesthesiajournal.co.uk/current.rss" ,
		"http://www.anesthesiology.theclinics.com/current.rss" ,
		"http://www.annallergy.org/current.rss" ,
		"http://www.annemergmed.com/current.rss" ,
		"http://www.annalsofepidemiology.org/current.rss" ,
		"http://www.annalsofglobalhealth.org/current.rss" ,
		"http://www.annalsjournal.com/current.rss" ,
		"http://www.annalsofvascularsurgery.com/current.rss" ,
		"http://www.appliedanimalbehaviour.com/current.rss" ,
		"http://www.arcmedres.com/current.rss" ,
		"http://www.archives-pmr.org/current.rss" ,
		"http://www.psychiatricnursing.org/current.rss" ,
		"http://www.arthroplastytoday.org/current.rss" ,
		"http://www.arthroscopyjournal.org/current.rss" ,
		"http://www.arthroscopytechniques.org/current.rss" ,
	] ,
	[
		"http://www.asianjournalofpsychiatry.com/current.rss" ,
		"http://www.e-asianjournalsurgery.com/current.rss" ,
		"http://www.asian-nursingresearch.com/current.rss" ,
		"http://www.atherosclerosis-journal.com/current.rss" ,
		"http://www.atherosclerosis-supplements.com/current.rss" ,
		"http://www.oralmaxsurgeryatlas.theclinics.com/current.rss" ,
		"http://www.urologicatlas.theclinics.com/current.rss" ,
		"http://www.aurisnasuslarynx.com/current.rss" ,
		"http://www.australiancriticalcare.com/current.rss" ,
		"http://www.autonomicneuroscience.com/current.rss" ,
		"http://www.bprcem.com/current.rss" ,
		"http://www.bprch.com/current.rss" ,
		"http://www.bprclinrheum.com/current.rss" ,
		"http://www.biologicalpsychiatryjournal.com/current.rss" ,
		"http://www.biologicalpsychiatrycnni.org/current.rss" ,
		"http://www.bbmt.org/current.rss" ,
		"http://www.bloodreviews.com/current.rss" ,
		"http://www.thebonejournal.com/current.rss" ,
		"http://www.brachyjournal.com/current.rss" ,
		"http://www.brainstimjrnl.com/current.rss" ,
		"http://www.brainanddevelopment.com/current.rss" ,
		"http://www.breastdiseasesquarterly.com/current.rss" ,
		"http://www.thebreastonline.com/current.rss" ,
		"http://www.bjoms.com/current.rss" ,
		"http://www.burnsjournal.com/current.rss" ,
		"http://www.burnsopen.com/content/rss" ,
		"http://www.cvcasejournal.com/current.rss" ,
		"http://journal.chestnet.org/current/rss" ,
		"http://www.carjonline.org/current.rss" ,
		"http://www.onlinecjc.ca/current.rss" ,
		"http://www.canadianjournalofdiabetes.com/current.rss" ,
		"http://www.canadianjournalofophthalmology.ca/current.rss" ,
		"http://www.cancergeneticsjournal.org/current.rss" ,
		"http://www.cancerletters.info/current.rss" ,
		"http://www.cancertreatmentreviews.com/current.rss" ,
		"http://www.cardiacep.theclinics.com/current.rss" ,
		"http://www.cardiology.theclinics.com/current.rss" ,
		"http://www.cardiovascularpathology.com/current.rss" ,
		"http://www.caringfortheages.com/current.rss" ,
		"http://www.cmghjournal.org/current.rss" ,
		"http://www.childpsych.theclinics.com/current.rss" ,
		"http://www.clinbiomech.com/current.rss" ,
		"http://www.clinical-breast-cancer.com/current.rss" ,
		"http://www.clinical-colorectal-cancer.com/current.rss" ,
		"http://www.ceghonline.com/current.rss" ,
		"http://www.cghjournal.org/current.rss" ,
		"http://www.clinical-genitourinary-cancer.com/current.rss" ,
		"http://www.clinicalimaging.org/current.rss" ,
		"http://www.clinical-lung-cancer.com/current.rss" ,
		"http://www.clinical-lymphoma-myeloma-leukemia.com/current.rss" ,
	] ,
	[
		"http://www.cmnewsletter.com/current.rss" ,
		"http://www.clinicalmicrobiologyandinfection.com/current.rss" ,
		"http://www.clinph-journal.com/current.rss" ,
		"http://www.cnp-journal.com/current.rss" ,
		"http://www.clinicalnutritionjournal.com/current.rss" ,
		"http://www.clinicalnutritionespen.com/current.rss" ,
		"http://www.clinicalnutritionexperimental.com/current.rss" ,
		"http://www.clinicaloncologyonline.net/current.rss" ,
		"http://www.clinicalradiologyonline.net/current.rss" ,
		"http://www.nursingsimulation.org/current.rss" ,
		"http://www.clinical-skin-cancer.com/current.rss" ,
		"http://www.clinicaltherapeutics.com/current.rss" ,
		"http://www.ctro.science/current.rss" ,
		"http://www.chestmed.theclinics.com/current.rss" ,
		"http://www.cidjournal.com/current.rss" ,
		"http://www.geriatric.theclinics.com/current.rss" ,
		"http://www.labmed.theclinics.com/current.rss" ,
		"http://www.liver.theclinics.com/current.rss" ,
		"http://www.perinatology.theclinics.com/current.rss" ,
		"http://www.plasticsurgery.theclinics.com/current.rss" ,
		"http://www.podiatric.theclinics.com/current.rss" ,
		"http://www.sportsmed.theclinics.com/current.rss" ,
		"http://www.collegianjournal.com/current.rss" ,
		"http://www.comppsychjournal.com/current.rss" ,
		"http://www.contactlensjournal.com/current.rss" ,
		"http://www.contemporaryclinicaltrials.com/current.rss" ,
		"http://www.contraceptionjournal.org/current.rss" ,
		"http://www.criticalcare.theclinics.com/current.rss" ,
		"http://www.ccnursing.theclinics.com/current.rss" ,
		"http://www.croh-online.com/current.rss" ,
		"http://www.cmrp-journal.com/current.rss" ,
		"http://www.cpcancer.com/current.rss" ,
		"http://www.cpcardiology.com/current.rss" ,
		"http://www.cpdrjournal.com/current.rss" ,
		"http://www.currprobsurg.com/current.rss" ,
		"http://www.celltherapyjournal.org/current.rss" ,
		"http://www.dentalabstracts.com/current.rss" ,
		"http://www.dental.theclinics.com/current.rss" ,
		"http://www.demajournal.com/current.rss" ,
		"http://www.derm.theclinics.com/current.rss" ,
		"http://www.derm-sinica.com/current.rss" ,
		"http://www.diabetesresearchclinicalpractice.com/current.rss" ,
		"http://www.diabet-metabolism.com/current.rss" ,
		"http://www.diagnostichistopathology.co.uk/current.rss" ,
		"http://www.dmidjournal.com/current.rss" ,
		"http://www.dldjournalonline.com/current.rss" ,
		"http://www.disabilityandhealthjnl.com/current.rss" ,
		"http://www.diseaseamonth.com/current.rss" ,
		"http://www.drugandalcoholdependence.com/current.rss" ,
		"http://www.ejinme.com/current.rss" ,
	] ,
	[
		"http://www.ejog.org/current.rss" ,
		"http://www.ejoncologynursing.com/current.rss" ,
		"http://www.ejpn-journal.com/current.rss" ,
		"http://www.ejradiology.com/current.rss" ,
		"http://www.ejropen.com/current.rss" ,
		"http://www.ejso.com/current.rss" ,
		"http://www.ejves.com/current.rss" ,
		"http://www.europeanneuropsychopharmacology.com/current.rss" ,
		"http://www.europsy-journal.com/current.rss" ,
		"http://www.europeanurology.com/current.rss" ,
		"http://www.eu-focus.europeanurology.com/current.rss" ,
		"http://www.eusupplements.europeanurology.com/current.rss" ,
		"http://www.ehbonline.org/current.rss" ,
		"http://www.exphem.org/current.rss" ,
		"http://www.explorejournal.com/current.rss" ,
		"http://www.ens-journal.com/current.rss" ,
		"http://www.ejcancer.com/current.rss" ,
		"http://www.ejvesreports.com/current.rss" ,
		"http://www.emed.theclinics.com/current.rss" ,
		"http://www.endo.theclinics.com/current.rss" ,
		"http://www.epilepsybehavior.com/current.rss" ,
		"http://www.europeangeriaticmedicine.com/current.rss" ,
		"http://www.facialplastic.theclinics.com/current.rss" ,
		"http://www.fertstert.org/current.rss" ,
		"http://www.foot.theclinics.com/current.rss" ,
		"http://www.footanklesurgery-journal.com/current.rss" ,
		"http://www.fsigenetics.com/current.rss" ,
		"http://www.fsigeneticssup.com/current.rss" ,
		"http://www.gaitposture.com/current.rss" ,
		"http://www.gastrojournal.org/current.rss" ,
		"http://www.gastro.theclinics.com/current.rss" ,
		"http://www.giejournal.org/current.rss" ,
		"http://www.giendo.theclinics.com/current.rss" ,
		"http://www.gnjournal.com/current.rss" ,
		"http://www.globalsurgery.net/current.rss" ,
		"http://www.growthhormoneigfresearch.com/current.rss" ,
		"http://www.gynecologiconcology-online.net/current.rss" ,
		"http://www.e-gmit.com/current.rss" ,
		"http://www.hpbonline.org/current.rss" ,
		"http://www.hand.theclinics.com/current.rss" ,
		"http://www.healthpolicyjrnl.com/current.rss" ,
		"http://www.healthpolicyandtechnology.org/current.rss" ,
		"http://www.heartandlung.org/current.rss" ,
		"http://www.heartfailure.theclinics.com/current.rss" ,
		"http://www.heartrhythmjournal.com/current.rss" ,
		"http://www.heartlungcirc.org/current.rss" ,
		"http://www.heartrhythmcasereports.com/current.rss" ,
		"http://www.hemonc.theclinics.com/current.rss" ,
		"http://www.homeopathyjournal.net/current.rss" ,
		"http://www.humanmicrobiomejrnl.com/current.rss" ,
	] ,
	[
		"http://www.humanpathol.com/current.rss" ,
		"http://www.humanpathologycasereports.com/current.rss" ,
		"http://www.ijsopen.com/current.rss" ,
		"http://www.immunology.theclinics.com/current.rss" ,
		"http://www.idhjournal.com.au/current.rss" ,
		"http://www.id.theclinics.com/current.rss" ,
		"http://www.injuryjournal.com/current.rss" ,
		"http://www.imr-journal.com/current.rss" ,
		"http://www.intensivecriticalcarenursing.com/current.rss" ,
		"http://www.internationalemergencynursing.com/current.rss" ,
		"http://www.ijaaonline.com/current.rss" ,
		"http://www.internationaljournalofcardiology.com/current.rss" ,
		"http://www.ijdp.org/current.rss" ,
		"http://www.ijge-online.com/current.rss" ,
		"http://www.ijidonline.com/current.rss" ,
		"http://www.journalofnursingstudies.com/current.rss" ,
		"http://www.obstetanesthesia.com/current.rss" ,
		"http://www.ijoms.com/current.rss" ,
		"http://www.orthopaedictraumanursing.com/current.rss" ,
		"http://www.journalofosteopathicmedicine.com/current.rss" ,
		"http://www.ijporlonline.com/current.rss" ,
		"http://www.redjournal.org/current.rss" ,
		"http://www.journal-surgery.net/current.rss" ,
		"http://www.casereports.com/current.rss" ,
		"http://www.ijsprotocols.com/current.rss" ,
		"http://www.ijwdonline.org/current.rss" ,
		"http://www.interventional.theclinics.com/current.rss" ,
		"http://www.jaadcasereports.org/current.rss" ,
		"http://www.jcrscasereports.com/current.rss" ,
		"http://www.jprasopen.com/current.rss" ,
		"http://www.jsesopenaccess.org/current.rss" ,
		"http://www.japanesedentalsciencereview.com/current.rss" ,
		"http://www.jointcommissionjournal.com/current.rss" ,
		"http://www.npjournal.org/current.rss" ,
		"http://www.jams-kpi.com/current.rss" ,
		"http://www.jahonline.org/current.rss" ,
		"http://www.jad-journal.com/current.rss" ,
		"http://www.jacionline.org/current.rss" ,
		"http://www.jaci-inpractice.org/current.rss" ,
		"http://www.jaapos.org/current.rss" ,
		"http://www.anesthesiahistoryjournal.org/current.rss" ,
		"http://www.journalofarrhythmia.com/current.rss" ,
		"http://www.arthroplastyjournal.org/current.rss" ,
		"http://www.jbiomech.com/current.rss" ,
		"http://www.bodyworkmovementtherapies.com/current.rss" ,
		"http://www.journalcancerpolicy.net/current.rss" ,
		"http://www.onlinejcf.com/current.rss" ,
		"http://www.journal-of-cardiology.com/current.rss" ,
		"http://www.journalofcardiologycases.com/current.rss" ,
		"http://www.jcvaonline.com/current.rss" ,
	] ,
	[
		"http://www.journalofcardiovascularct.com/current.rss" ,
		"http://www.jcrsjournal.org/current.rss" ,
		"http://www.journalchirohumanities.com/current.rss" ,
		"http://www.journalchiromed.com/current.rss" ,
		"http://www.jctejournal.com/current.rss" ,
		"http://www.jctecasereports.com/current.rss" ,
		"http://www.jcafulltextonline.com/current.rss" ,
		"http://www.clinicaldensitometry.com/current.rss" ,
		"http://www.jclinepi.com/current.rss" ,
		"http://www.lipidjournal.com/current.rss" ,
		"http://www.jocn-journal.com/current.rss" ,
		"http://www.journal-cot.com/current.rss" ,
		"http://www.clinicaltuberculosisjournal.com/current.rss" ,
		"http://www.journalofclinicalvirology.com/current.rss" ,
		"http://www.jcehepatology.com/current.rss" ,
		"http://www.jcmfs.com/current.rss" ,
		"http://www.jccjournal.org/current.rss" ,
		"http://www.cysticfibrosisjournal.com/current.rss" ,
		"http://www.journalofdairyscience.org/current.rss" ,
		"http://www.e-jds.com/current.rss" ,
		"http://www.jdsjournal.com/current.rss" ,
		"http://www.jdcjournal.com/current.rss" ,
		"http://www.jecgonline.com/current.rss" ,
		"http://www.jem-journal.com/current.rss" ,
		"http://www.jenonline.org/current.rss" ,
		"http://www.jendodon.com/current.rss" ,
		"http://www.j-evs.com/current.rss" ,
		"http://www.journalofethnicfoods.net/current.rss" ,
		"http://www.jebdp.com/current.rss" ,
		"http://www.exoticpetmedicine.com/current.rss" ,
		"http://www.jfda-online.com/current.rss" ,
		"http://www.jfas.org/current.rss" ,
		"http://www.jofri.net/current.rss" ,
		"http://www.jflmjournal.org/current.rss" ,
		"http://www.geriatriconcology.net/current.rss" ,
		"http://www.ginsengres.com/current.rss" ,
		"http://www.jgaronline.com/current.rss" ,
		"http://www.jhandsurg.org/current.rss" ,
		"http://www.jhandtherapy.org/current.rss" ,
		"http://www.jhltonline.org/current.rss" ,
		"http://www.journal-of-hepatology.eu/current.rss" ,
		"http://www.journalofhospitalinfection.com/current.rss" ,
		"http://www.journalofinfection.com/current.rss" ,
		"http://www.jiac-j.com/current.rss" ,
		"http://www.jiph.org/current.rss" ,
		"http://www.jieponline.com/current.rss" ,
		"http://www.jidonline.org/current.rss" ,
		"http://www.jidsponline.org/current.rss" ,
		"http://www.jmptonline.org/current.rss" ,
		"http://www.jmirs.org/current.rss" ,
	] ,
	[
		"http://www.jmu-online.com/current.rss" ,
		"http://www.e-jmii.com/current.rss" ,
		"http://www.jmig.org/current.rss" ,
		"http://jmd.amjpathol.org/current.rss" ,
		"http://www.jmmc-online.com/current.rss" ,
		"http://www.journalofneonatalnursing.com/current.rss" ,
		"http://www.jni-journal.com/current.rss" ,
		"http://www.journalofnursingregulation.com/current.rss" ,
		"http://www.jneb.org/current.rss" ,
		"http://www.jognn.org/current.rss" ,
		"http://www.jogc.com/current.rss" ,
		"http://www.journaloforalbiosciences.org/current.rss" ,
		"http://www.joms.org/current.rss" ,
		"http://www.journaloforthopaedicscience.com/current.rss" ,
		"http://www.jpsmjournal.com/current.rss" ,
		"http://www.jpain.org/current.rss" ,
		"http://www.jpedhc.org/current.rss" ,
		"http://www.pediatricnursing.org/current.rss" ,
		"http://www.jpedsurg.org/current.rss" ,
		"http://www.jpscasereports.com/current.rss" ,
		"http://www.jpurol.com/current.rss" ,
		"http://www.jpagonline.org/current.rss" ,
		"http://www.jpeds.com/current.rss" ,
		"http://www.jopan.org/current.rss" ,
		"http://jpharmsci.org/current.rss" ,
		"http://www.journalofphysiotherapy.com/current.rss" ,
		"http://www.jprasurg.com/current.rss" ,
		"http://www.professionalnursing.org/current.rss" ,
		"http://www.thejpd.org/current.rss" ,
		"http://www.journalofprosthodonticresearch.com/current.rss" ,
		"http://www.journalofpsychiatricresearch.com/current.rss" ,
		"http://www.jpsychores.com/current.rss" ,
		"http://www.radiologynursing.org/current.rss" ,
		"http://www.jrnjournal.org/current.rss" ,
		"http://www.jsams.org/current.rss" ,
		"http://www.jsm.jsexmed.org/current.rss" ,
		"http://www.jshoulderelbow.org/current.rss" ,
		"http://www.jsse.space-safety.org/current.rss" ,
		"http://www.strokejournal.org/current.rss" ,
		"http://www.journalofsubstanceabusetreatment.com/current.rss" ,
		"http://www.jsurged.org/current.rss" ,
		"http://www.journalofsurgicalresearch.com/current.rss" ,
		"http://www.jto.org/current.rss" ,
		"http://www.jtcvsonline.org/current.rss" ,
		"http://www.journaloftissueviability.com/current.rss" ,
		"http://www.jurology.com/current.rss" ,
		"http://www.jvascnurs.net/current.rss" ,
		"http://www.jvascsurg.org/current.rss" ,
		"http://jvscit.org/current.rss" ,
		"http://www.jvsvenous.org/current.rss" ,
	] ,
	[
		"http://www.jvir.org/current.rss" ,
		"http://www.journalvetbehavior.com/current.rss" ,
		"http://www.jvoice.org/current.rss" ,
		"http://jandonline.org/current.rss" ,
		"http://www.jaacap.com/current.rss" ,
		"http://www.jaad.org/current.rss" ,
		"http://www.jaccws.org/current.rss" ,
		"http://www.jacr.org/current.rss" ,
		"http://www.journalacs.org/current.rss" ,
		"http://jada.ada.org/current.rss" ,
		"http://www.jamda.com/current.rss" ,
		"http://www.japha.org/current.rss" ,
		"http://www.jascyto.org/current.rss" ,
		"http://www.onlinejase.com/current.rss" ,
		"http://www.ashjournal.com/current.rss" ,
		"http://www.avajournal.com/current.rss" ,
		"http://www.nursesinaidscarejournal.org/current.rss" ,
		"http://www.jcma-online.com/current.rss" ,
		"http://www.jfma-online.com/current.rss" ,
		"http://www.journalnma.org/current.rss" ,
		"http://www.jns-journal.com/current.rss" ,
		"http://www.journalofthesaudiheart.com/current.rss" ,
		"http://www.jwfo.org/current.rss" ,
		"http://www.kjms-online.com/current.rss" ,
		"http://www.kidney-international.org/current.rss" ,
		"http://www.kireports.org/current.rss" ,
		"http://www.kisupplements.org/current.rss" ,
		"http://www.thekneejournal.com/current.rss" ,
		"http://www.legalmedicinejournal.com/current.rss" ,
		"http://www.lrjournal.com/current.rss" ,
		"http://www.livestockscience.com/current.rss" ,
		"http://www.lungcancerjournal.info/current.rss" ,
		"http://www.mrijournal.com/current.rss" ,
		"http://www.mri.theclinics.com/current.rss" ,
		"http://www.maturitas.org/current.rss" ,
		"http://www.mayoclinicproceedings.org/current.rss" ,
		"http://mcpiqojournal.org/current.rss" ,
		"http://www.medical.theclinics.com/current.rss" ,
		"http://www.meddos.org/current.rss" ,
		"http://www.medengphys.com/current.rss" ,
		"http://www.medical-hypotheses.com/current.rss" ,
		"http://www.medicalimageanalysisjournal.com/current.rss" ,
		"http://www.mjafi.net/current.rss" ,
		"http://medicinepublishing.com/current.rss" ,
		"http://www.medicinejournal.co.uk/current.rss" ,
		"http://www.metabolismjournal.com/current.rss" ,
		"http://www.midwiferyjournal.com/current.rss" ,
		"http://www.journalapps.elsevier.com/current.rss" ,
		"http://www.mgmjournal.com/current.rss" ,
		"http://www.molmetab.com/current.rss" ,
	] ,
	[
		"http://www.msard-journal.com/current.rss" ,
		"http://www.mskscienceandpractice.com/current.rss" ,
		"http://www.mskscienceandpractice.com/current.rss" ,
		"http://www.neoplasia.com/current.rss" ,
		"http://www.neurobiologyofaging.org/current.rss" ,
		"http://www.neuroimaging.theclinics.com/current.rss" ,
		"http://www.neurologic.theclinics.com/current.rss" ,
		"http://www.nmd-journal.com/current.rss" ,
		"http://www.neuropeptidesjournal.com/current.rss" ,
		"http://www.neurosurgery.theclinics.com/current.rss" ,
		"http://www.newhorizonsclinicalcasereports.com/current.rss" ,
		"http://www.newhorizonsintranslationalmedicine.com/current.rss" ,
		"http://www.newmicrobesnewinfections.com/current.rss" ,
		"http://www.nucmedbio.com/current.rss" ,
		"http://www.nurseeducationtoday.com/current.rss" ,
		"http://www.nurseeducationinpractice.com/current.rss" ,
		"http://www.nurseleader.com/current.rss" ,
		"http://www.nursing.theclinics.com/current.rss" ,
		"http://www.nursingoutlook.org/current.rss" ,
		"http://nwhjournal.org/current.rss" ,
		"http://www.nursingplusopen.com/current.rss" ,
		"http://www.nutritionjrnl.com/current.rss" ,
		"http://www.nmcd-journal.com/current.rss" ,
		"http://www.obesitymedicinejournal.com/current.rss" ,
		"http://www.obesityresearchclinicalpractice.com/current.rss" ,
		"http://www.obgyn.theclinics.com/current.rss" ,
		"http://www.obstetrics-gynaecology-journal.com/current.rss" ,
		"http://www.theocularsurfacejournal.com/current.rss" ,
		"http://www.optecoto.com/current.rss" ,
		"http://www.optechtcs.com/current.rss" ,
		"http://www.aaojournal.org/current.rss" ,
		"http://www.ophthalmology.theclinics.com/current.rss" ,
		"http://www.ophthalmologyretina.org/current.rss" ,
		"http://www.oraloncology.com/current.rss" ,
		"http://www.oralscienceinternational.com/current.rss" ,
		"http://www.oooojournal.net/current.rss" ,
		"http://www.oralmaxsurgery.theclinics.com/current.rss" ,
		"http://www.orthopaedicsandtraumajournal.co.uk/current.rss" ,
		"http://www.orthopedic.theclinics.com/current.rss" ,
		"http://www.oarsijournal.com/current.rss" ,
		"http://www.oto.theclinics.com/current.rss" ,
		"http://www.otolaryngologycasereports.com/current.rss" ,
		"http://www.pet.theclinics.com/current.rss" ,
		"http://www.pmrjournal.org/current.rss" ,
		"http://www.prrjournal.com/current.rss" ,
		"http://www.paediatricsandchildhealthjournal.co.uk/current.rss" ,
		"http://www.painmanagementnursing.org/current.rss" ,
		"http://www.pancreatology.net/current.rss" ,
		"http://www.prd-journal.com/current.rss" ,
		"http://www.pathologyjournal.rcpa.edu.au/current.rss" ,
	] ,
	[
		"http://www.pathophysiologyjournal.com/current.rss" ,
		"http://www.pec-journal.com/current.rss" ,
		"http://www.pediatric.theclinics.com/current.rss" ,
		"http://www.pediatric-dental-journal.com/current.rss" ,
		"http://www.pedneur.com/current.rss" ,
		"http://www.pediatr-neonatol.com/current.rss" ,
		"http://www.pcorm.com/current.rss" ,
		"http://www.periopnursing.theclinics.com/current.rss" ,
		"http://www.personalizedmedicineuniverse.com/current.rss" ,
		"http://www.personalizedmedpsych.com/current.rss" ,
		"http://www.pharmacytoday.org/current.rss" ,
		"http://www.pdpdt-journal.com/current.rss" ,
		"http://www.physicamedica.com/current.rss" ,
		"http://www.pmr.theclinics.com/current.rss" ,
		"http://www.physicaltherapyinsport.com/current.rss" ,
		"http://physicianassistant.theclinics.com/current.rss" ,
		"http://phiro.science/current.rss" ,
		"http://www.physiotherapyjournal.com/current.rss" ,
		"http://www.placentajournal.org/current.rss" ,
		"http://www.practicalradonc.org/current.rss" ,
		"http://www.primary-care-diabetes.com/current.rss" ,
		"http://www.primarycare.theclinics.com/content/rss" ,
		"http://www.professionalanimalscientist.org/current.rss" ,
		"http://www.onlinepcd.com/current.rss" ,
		"http://www.ppc-journal.com/current.rss" ,
		"http://www.plefa.com/current.rss" ,
		"http://www.p-international.com/current.rss" ,
		"http://www.psych.theclinics.com/current.rss" ,
		"http://www.psy-journal.com/current.rss" ,
		"http://www.psyn-journal.com/current.rss" ,
		"http://www.psyneuen-journal.com/current.rss" ,
		"http://www.psychosomaticsjournal.com/current.rss" ,
		"http://www.publichealthjrnl.com/current.rss" ,
		"http://www.radiographyonline.com/current.rss" ,
		"http://www.radiologic.theclinics.com/current.rss" ,
		"http://www.thegreenjournal.com/current.rss" ,
		"http://www.rbmojournal.com/current.rss" ,
		"http://www.rbmsociety.com/current.rss" ,
		"http://www.rsap.org/current.rss" ,
		"http://www.respiratoryinvestigation.com/current.rss" ,
		"http://www.resmedjournal.com/current.rss" ,
		"http://www.respiratorycasereports.com/current.rss" ,
		"http://www.resuscitationjournal.com/current.rss" ,
		"http://www.rheumatic.theclinics.com/current.rss" ,
		"http://www.e-shaw.net/current.rss" ,
		"http://www.saudiophthaljournal.com/current.rss" ,
		"http://www.scandinavianjournalpain.com/current.rss" ,
		"http://www.schres-journal.com/current.rss" ,
		"http://www.scienceandjusticejournal.com/current.rss" ,
		"http://www.seizure-journal.com/current.rss" ,	
	] ,
	[
		"http://www.semarthritisrheumatism.com/current.rss" ,
		"http://www.semarthroplasty.com/current.rss" ,
		"http://www.seminarscolonrectalsurgery.com/current.rss" ,
		"http://www.sfnmjournal.com/current.rss" ,
		"http://www.seminhematol.org/current.rss" ,
		"http://www.seminarsinnephrology.org/current.rss" ,
		"http://www.seminarsinnuclearmedicine.com/current.rss" ,
		"http://www.seminoncol.org/current.rss" ,
		"http://www.semortho.com/current.rss" ,
		"http://www.sempedneurjnl.com/current.rss" ,
		"http://www.sempedsurg.org/current.rss" ,
		"http://www.seminperinat.com/current.rss" ,
		"http://www.semradonc.com/current.rss" ,
		"http://www.seminarsinroentgenology.com/current.rss" ,
		"http://www.semtcvspeds.com/current.rss" ,
		"http://www.semthorcardiovascsurg.com/current.rss" ,
		"http://www.semultrasoundctmri.com/current.rss" ,
		"http://www.smoa.jsexmed.org/current.rss" ,
		"http://www.smr.jsexmed.org/current.rss" ,
		"http://www.sleephealthjournal.org/current.rss" ,
		"http://www.sleep-journal.com/current.rss" ,
		"http://www.sleep.theclinics.com/current.rss" ,
		"http://www.smrv-journal.com/current.rss" ,
		"http://www.smallruminantresearch.com/current.rss" ,
		"http://www.spine-deformity.org/current.rss" ,
		"http://www.thespinejournalonline.com/current.rss" ,
		"http://www.sotjournal.com/current.rss" ,
		"http://www.structuresjournal.org/current.rss" ,
		"http://www.thesurgeon.net/current.rss" ,
		"http://www.surgjournal.com/current.rss" ,
		"http://www.surgeryjournal.co.uk/current.rss" ,
		"http://www.soard.org/current.rss" ,
		"http://www.surgical.theclinics.com/current.rss" ,
	] ,
	[
		"http://www.surgonc.theclinics.com/current.rss" ,
		"http://www.surgpath.theclinics.com/current.rss" ,
		"http://www.surveyophthalmol.com/current.rss" ,
		"http://www.tjog-online.com/current.rss" ,
		"http://www.jtln.org/current.rss" ,
		"http://www.tipsro.science/current.rss" ,
		"http://www.techvir.com/current.rss" ,
		"http://www.annalsthoracicsurgery.org/current.rss" ,
		"http://www.theriojournal.com/current.rss" ,
		"http://www.thoracic.theclinics.com/current.rss" ,
		"http://www.thrombosisresearch.com/current.rss" ,
		"http://www.companimalmed.com/current.rss" ,
		"http://www.tmreviews.com/current.rss" ,
		"http://www.trasci.com/current.rss" ,
		"http://www.transonc.com/current.rss" ,
		"http://www.translationalres.com/current.rss" ,
		"http://www.transplantation-proceedings.org/current.rss" ,
		"http://www.transplantationreviews.com/current.rss" ,
		"http://www.travelmedicinejournal.com/current.rss" ,
		"http://www.trendsanaesthesiacriticalcare.com/current.rss" ,
		"http://www.tcmonline.org/current.rss" ,
		"http://www.tuberculosisjournal.com/current.rss" ,
		"http://www.umbjournal.org/current.rss" ,
		"http://www.urologic.theclinics.com/current.rss" ,
		"http://www.urologiconcology.org/current.rss" ,
		"http://www.urol-sci.com/current.rss" ,
		"http://www.goldjournal.net/current.rss" ,
		"http://www.urologycasereports.com/current.rss" ,
		"http://www.urologypracticejournal.com/current.rss" ,
		"http://www.valueinhealthjournal.com/current.rss" ,
		"http://www.valuehealthregionalissues.com/current.rss" ,
		"http://www.vaajournal.org/current.rss" ,
		"http://www.vetequine.theclinics.com/current.rss" ,
		"http://www.vetexotic.theclinics.com/current.rss" ,
		"http://www.vetfood.theclinics.com/current.rss" ,
		"http://www.vetsmall.theclinics.com/current.rss" ,
		"http://www.videogie.org/current.rss" ,
		"http://www.wemjournal.org/current.rss" ,
		"http://www.womenandbirth.org/current.rss" ,
		"http://www.whijournal.com/current.rss" ,
		"http://www.worldneurosurgery.org/current.rss" ,
		"http://zefq-journal.com/current.rss" ,
	] ,



];
module.exports.RSS_URLS = RSS_URLS;