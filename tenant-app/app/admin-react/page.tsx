"use client"

import * as React from "react"
import { useAdminState } from "@/hooks/useAdminState"
import { TaskCard, type Task } from "@/components/ui/TaskCard"
import { SidebarBanner } from "@/components/ui/SidebarBanner"
import { WeatherWidget } from "@/components/ui/WeatherWidget"
import { MasonryGrid } from "@/components/ui/MasonryGrid"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Checkbox } from "@/components/ui/Checkbox"
import { Modal } from "@/components/ui/Modal"
import { toast } from "@/components/ui/Toast"
import { DatePicker } from "@/components/ui/DatePicker"
import { format } from "date-fns"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminFilters } from "@/components/admin/AdminFilters"
import { AdminTaskTable } from "@/components/admin/AdminTaskTable"
import { AdminModals } from "@/components/admin/AdminModals"
import { AdminPrintLayouts } from "@/components/admin/AdminPrintLayouts"
import { SubscriptionModal } from "@/components/admin/SubscriptionModal"
import { SubscriptionWidget } from "@/components/ui/SubscriptionWidget"

export default function AdminReactPage() {

  
    const adminState = useAdminState()
  const {
    tenantId, tenantName, tasks, teams, setTeams, workers, setWorkers, categories, setCategories,
    systemTeams, setSystemTeams, loadTasks, loading, setLoading, printModalOpen, setPrintModalOpen,
    printLang, setPrintLang, printWorker, setPrintWorker, executeOutputSequence, workerQrModalOpen,
    setWorkerQrModalOpen, qrModalOpen, setQrModalOpen, workersModalOpen, setWorkersModalOpen,
    teamsModalOpen, setTeamsModalOpen, configModalOpen, setConfigModalOpen, integrationsModalOpen,
    setIntegrationsModalOpen, promptModalData, setPromptModalData, confirmModalData, setConfirmModalData,
    reportsModalOpen, setReportsModalOpen, reportsStart, setReportsStart, reportsEnd, setReportsEnd,
    isReportsLoading, loadReports, reportsData, handlePrintReports, telegramBotToken, setTelegramBotToken,
    telegramChatId, setTelegramChatId, whatsappInstance, setWhatsappInstance, whatsappToken, setWhatsappToken,
    searchQuery, setSearchQuery, warningStats, workerStats, printMode, setPrintMode, isOutputProcessing, handleManagerReportPrint,
    filterDept, setFilterDept, activeDepts, filterDate, setFilterDate, taskDates, handleSelectAll,
    selectedTasks, filtered, viewMode, setViewMode, handlePrintSelected, handleSendToApp, handleCloseMass,
    handleReturnToOpenMass, activeTabs, currentTab, setCurrentTab, handleToggleCheck, handleApprove,
    handleReturnToOpen, handleDelete, handleTeamChange, handleEditDefect, printDocumentData, printCardsData,
    qrSettings, setQrSettings, saveQrSettings, exportTasksToCSV, handleCleanupTasks,
    tenantStatus, setTenantStatus, plan, setPlan, price, setPrice,
    subscriptionEndsAt, setSubscriptionEndsAt, plans, setPlans,
    subscriptionModalOpen, setSubscriptionModalOpen
  } = adminState
  if (!tenantId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#858d9c]">
        <div className="text-white text-xl animate-pulse">טוען נתונים...</div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-[#858d9c] p-4 lg:p-8 print:hidden" dir="rtl">
      {/* Top Header */}
      <AdminHeader
        tenantName={tenantName}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        loadTasks={loadTasks}
        setWorkerQrModalOpen={setWorkerQrModalOpen}
        setQrModalOpen={setQrModalOpen}
        setWorkersModalOpen={setWorkersModalOpen}
        setTeamsModalOpen={setTeamsModalOpen}
        setConfigModalOpen={setConfigModalOpen}
        setIntegrationsModalOpen={setIntegrationsModalOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-col 2xl:flex-row gap-6">
        
        {/* Sidebar */}
        <div className="flex flex-col gap-4 w-full 2xl:w-64 shrink-0 z-0">
          <SidebarBanner 
            title="התראות וחריגים"
            items={warningStats}
            className="bg-[#d2cbd0] border-transparent"
            icon={
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />

          <SidebarBanner 
            title="סטטוס משימות"
            items={workerStats}
            className="bg-[#b0b4be] border-transparent"
            icon={
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          
          <WeatherWidget />

          <SubscriptionWidget
            tenantStatus={tenantStatus}
            subscriptionEndsAt={subscriptionEndsAt}
            plan={plan}
            price={price}
            onOpenSubscriptionModal={() => setSubscriptionModalOpen(true)}
          />
        </div>

        {/* Content */}
        <div className="flex-1 w-full max-w-[1600px] mx-auto space-y-4">
          {/* Main Action Bar */}
          <AdminFilters
            setReportsModalOpen={setReportsModalOpen}
            setPrintMode={setPrintMode}
            setPrintModalOpen={setPrintModalOpen}
            handleManagerReportPrint={handleManagerReportPrint}
            filterDept={filterDept}
            setFilterDept={setFilterDept}
            activeDepts={activeDepts}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            taskDates={taskDates}
            handleSelectAll={handleSelectAll}
            selectedTasksSize={selectedTasks.size}
            filteredLength={filtered.length}
            viewMode={viewMode}
            setViewMode={setViewMode}
            handlePrintSelected={handlePrintSelected}
            handleSendToApp={handleSendToApp}
            handleCloseMass={handleCloseMass}
            handleReturnToOpenMass={handleReturnToOpenMass}
          />

          {/* Tabs */}
          <AdminTaskTable
            activeTabs={activeTabs}
            tasks={tasks}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            loading={loading}
            filtered={filtered}
            viewMode={viewMode}
            selectedTasks={selectedTasks}
            handleToggleCheck={handleToggleCheck}
            handleApprove={handleApprove}
            handleReturnToOpen={handleReturnToOpen}
            handleDelete={handleDelete}
            teams={teams}
            handleTeamChange={handleTeamChange}
            handleEditDefect={handleEditDefect}
          />

        </div>
      </div>

      <AdminModals 
        tenantId={tenantId}
        tenantName={tenantName}
        tasks={tasks}
        teams={teams}
        setTeams={setTeams}
        workers={workers}
        setWorkers={setWorkers}
        categories={categories}
        setCategories={setCategories}
        systemTeams={systemTeams}
        setSystemTeams={setSystemTeams}
        loadTasks={loadTasks}
        loading={loading}
        setLoading={setLoading}
        printModalOpen={printModalOpen}
        setPrintModalOpen={setPrintModalOpen}
        printLang={printLang}
        setPrintLang={setPrintLang}
        printWorker={printWorker}
        setPrintWorker={setPrintWorker}
        printMode={printMode}
        isOutputProcessing={isOutputProcessing}
        executeOutputSequence={executeOutputSequence}
        workerQrModalOpen={workerQrModalOpen}
        setWorkerQrModalOpen={setWorkerQrModalOpen}
        qrModalOpen={qrModalOpen}
        setQrModalOpen={setQrModalOpen}
        workersModalOpen={workersModalOpen}
        setWorkersModalOpen={setWorkersModalOpen}
        teamsModalOpen={teamsModalOpen}
        setTeamsModalOpen={setTeamsModalOpen}
        configModalOpen={configModalOpen}
        setConfigModalOpen={setConfigModalOpen}
        integrationsModalOpen={integrationsModalOpen}
        setIntegrationsModalOpen={setIntegrationsModalOpen}
        promptModalData={promptModalData}
        setPromptModalData={setPromptModalData}
        confirmModalData={confirmModalData}
        setConfirmModalData={setConfirmModalData}
        reportsModalOpen={reportsModalOpen}
        setReportsModalOpen={setReportsModalOpen}
        reportsStart={reportsStart}
        setReportsStart={setReportsStart}
        reportsEnd={reportsEnd}
        setReportsEnd={setReportsEnd}
        isReportsLoading={isReportsLoading}
        loadReports={loadReports}
        reportsData={reportsData}
        handlePrintReports={handlePrintReports}
        telegramBotToken={telegramBotToken}
        setTelegramBotToken={setTelegramBotToken}
        telegramChatId={telegramChatId}
        setTelegramChatId={setTelegramChatId}
        whatsappInstance={whatsappInstance}
        setWhatsappInstance={setWhatsappInstance}
        whatsappToken={whatsappToken}
        setWhatsappToken={setWhatsappToken}
        qrSettings={qrSettings}
        setQrSettings={setQrSettings}
        saveQrSettings={saveQrSettings}
        exportTasksToCSV={exportTasksToCSV}
        handleCleanupTasks={handleCleanupTasks}
      />

      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        tenantId={tenantId}
        tenantName={tenantName}
        tenantStatus={tenantStatus}
        currentPlan={plan}
        currentPrice={price}
        subscriptionEndsAt={subscriptionEndsAt}
        plans={plans}
        onSuccessRenewal={(updated) => {
          if (updated) {
            if (updated.status) setTenantStatus(updated.status);
            if (updated.plan) setPlan(updated.plan);
            if (updated.price !== undefined) setPrice(updated.price);
            if (updated.subscriptionEndsAt) setSubscriptionEndsAt(updated.subscriptionEndsAt);
          }
          loadTasks();
        }}
      />
      {/* Scroll to Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 hover:-translate-y-1 transition-all z-50 print:hidden"
      >
        <i className="fas fa-arrow-up"></i>
      </button>
      
      </div>
    
    <AdminPrintLayouts 
      printDocumentData={printDocumentData}
      printCardsData={printCardsData}
      printLang={printLang}
      printWorker={printWorker}
    />
    </>
  )
}




